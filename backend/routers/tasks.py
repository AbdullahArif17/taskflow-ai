from fastapi import APIRouter, Depends, HTTPException, status
from starlette.concurrency import run_in_threadpool

from config import get_settings
from dependencies import require_access_token
from models.schemas import TaskCreateRequest, TaskResponse, TaskStepResponse
from services.gemini_agent import (
    AgentConfigurationError,
    AgentResponseError,
    generate_steps,
)
from services.supabase_client import SupabaseError, SupabaseRestClient

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskResponse)
async def create_task(
    payload: TaskCreateRequest,
    token: str = Depends(require_access_token),
    settings=Depends(get_settings),
) -> TaskResponse:
    supabase = SupabaseRestClient(
        settings.supabase_url,
        settings.supabase_anon_key,
        settings.supabase_service_role_key,
        token,
    )

    try:
        user = await supabase.get_user()
        profile = await supabase.get_or_create_profile(user)
        steps = await run_in_threadpool(
            generate_steps,
            payload.title,
            settings.gemini_api_key,
            settings.gemini_model,
        )
        await supabase.consume_task_quota(
            user.id,
            int(profile.get("tasks_used_this_month") or 0),
            str(profile.get("plan") or "free"),
        )
        task = await supabase.create_task(user.id, payload.title)
        await supabase.add_activity(user.id, task["id"], "Agent received the task.")
        await supabase.add_activity(user.id, task["id"], f"Agent generated {len(steps)} steps.")
        created_steps = await supabase.create_steps(task["id"], steps)
        await supabase.add_activity(user.id, task["id"], "Task plan is ready.")
    except HTTPException:
        raise
    except AgentConfigurationError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error))
    except AgentResponseError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error))
    except SupabaseError as error:
        if "FREE_PLAN_LIMIT_REACHED" in str(error):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Free plan limit reached. Upgrade to Pro to create more tasks.",
            ) from error
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error))

    return TaskResponse(
        id=task["id"],
        title=task["title"],
        status=task["status"],
        steps=[
            TaskStepResponse(
                id=step["id"],
                step_order=step["step_order"],
                description=step["description"],
                status=step["status"],
            )
            for step in created_steps
        ],
    )
