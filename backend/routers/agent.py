from fastapi import APIRouter

router = APIRouter(prefix="/agent", tags=["agent"])


@router.get("/health")
async def agent_health() -> dict[str, str]:
    return {"status": "ready"}
