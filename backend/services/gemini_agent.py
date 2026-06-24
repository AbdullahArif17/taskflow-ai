import json
import re

from google import genai
from google.genai import errors


class AgentConfigurationError(RuntimeError):
    pass


class AgentResponseError(RuntimeError):
    pass


def _extract_json_array(text: str) -> list[str]:
    match = re.search(r"\[[\s\S]*\]", text)
    if not match:
        raise AgentResponseError("Gemini did not return a JSON array.")

    parsed = json.loads(match.group(0))
    if not isinstance(parsed, list):
        raise AgentResponseError("Gemini response was not a list.")

    steps = [item.strip() for item in parsed if isinstance(item, str) and item.strip()]
    if not 3 <= len(steps) <= 6:
        raise AgentResponseError("Gemini must return 3 to 6 actionable steps.")

    return steps


def generate_steps(task_title: str, api_key: str | None, model_name: str) -> list[str]:
    if not api_key:
        raise AgentConfigurationError("GEMINI_API_KEY is not configured.")

    client = genai.Client(api_key=api_key)
    prompt = (
        "Break this task into 3 to 6 short, actionable steps. "
        "Return only a JSON array of strings with no markdown.\n\n"
        f"Task: {task_title}"
    )
    try:
        response = client.models.generate_content(model=model_name, contents=prompt)
    except errors.APIError as error:
        raise AgentResponseError(f"Gemini API error: {error}") from error

    return _extract_json_array(response.text or "")
