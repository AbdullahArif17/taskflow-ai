from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


class TaskCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=500)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if len(normalized) < 3:
            raise ValueError("Task title must contain at least 3 characters.")
        return normalized


class TaskStepResponse(BaseModel):
    id: str
    step_order: int
    description: str
    status: Literal["pending", "done"]


class TaskResponse(BaseModel):
    id: str
    title: str
    status: Literal["pending", "in_progress", "completed"]
    steps: list[TaskStepResponse]


class TaskStepUpdateRequest(BaseModel):
    status: Literal["pending", "done"]


class DeleteResponse(BaseModel):
    deleted: bool


class GmailConnectResponse(BaseModel):
    url: str


class GmailStatusResponse(BaseModel):
    configured: bool
    connected: bool
    email: str | None = None


class GmailDraftRequest(BaseModel):
    to: EmailStr
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=20000)


class GmailDraftResponse(BaseModel):
    draft_id: str


class CheckoutSessionResponse(BaseModel):
    url: str


class ErrorResponse(BaseModel):
    detail: str
