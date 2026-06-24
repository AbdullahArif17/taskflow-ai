from pydantic import BaseModel, Field, field_validator


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
    status: str


class TaskResponse(BaseModel):
    id: str
    title: str
    status: str
    steps: list[TaskStepResponse]


class CheckoutSessionResponse(BaseModel):
    url: str


class ErrorResponse(BaseModel):
    detail: str
