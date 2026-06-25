from fastapi import APIRouter, Depends, HTTPException, status
from starlette.concurrency import run_in_threadpool

from config import get_settings
from dependencies import require_access_token
from models.schemas import (
    DeleteResponse,
    TaskCreateRequest,
    TaskResponse,
    TaskStepResponse,
    TaskStepUpdateRequest,
)
from services.gemini_agent import (
    AgentConfigurationError,
    AgentResponseError,
    generate_steps,
)
from services.supabase_client import SupabaseError, SupabaseRestClient

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _task_response(task: dict) -> TaskResponse:
    steps = sorted(task.get("task_steps") or [], key=lambda step: step["step_order"])
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
            for step in steps
        ],
    )


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

    return _task_response({**task, "task_steps": created_steps})


@router.patch("/{task_id}/steps/{step_id}", response_model=TaskResponse)
async def update_task_step(
    task_id: str,
    step_id: str,
    payload: TaskStepUpdateRequest,
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
        task = await supabase.get_task(user.id, task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

        steps = task.get("task_steps") or []
        target_step = next((step for step in steps if step["id"] == step_id), None)
        if not target_step:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task step not found.")

        await supabase.update_step_status(task_id, step_id, payload.status)
        for step in steps:
            if step["id"] == step_id:
                step["status"] = payload.status

        done_count = sum(step["status"] == "done" for step in steps)
        if done_count == 0:
            task_status = "pending"
        elif done_count == len(steps):
            task_status = "completed"
        else:
            task_status = "in_progress"

        if task["status"] != task_status:
            await supabase.update_task_status(task_id, task_status)
        task["status"] = task_status
        action = "completed" if payload.status == "done" else "reopened"
        await supabase.add_activity(
            user.id,
            task_id,
            f"Step {target_step['step_order']} {action}.",
        )
        if task_status == "completed":
            await supabase.add_activity(user.id, task_id, "Task completed.")
    except HTTPException:
        raise
    except SupabaseError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error

    return _task_response(task)


@router.delete("/{task_id}", response_model=DeleteResponse)
async def delete_task(
    task_id: str,
    token: str = Depends(require_access_token),
    settings=Depends(get_settings),
) -> DeleteResponse:
    supabase = SupabaseRestClient(
        settings.supabase_url,
        settings.supabase_anon_key,
        settings.supabase_service_role_key,
        token,
    )

    try:
        user = await supabase.get_user()
        task = await supabase.get_task(user.id, task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
        await supabase.delete_task(task_id, user.id)
        await supabase.add_activity(user.id, None, f'Task deleted: "{task["title"]}".')
    except HTTPException:
        raise
    except SupabaseError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error

    return DeleteResponse(deleted=True)
