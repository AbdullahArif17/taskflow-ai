from dataclasses import dataclass
from datetime import UTC, datetime
from urllib.parse import quote

import httpx


class SupabaseError(RuntimeError):
    pass


@dataclass(frozen=True)
class UserContext:
    id: str
    email: str | None


class SupabaseRestClient:
    def __init__(self, url: str, anon_key: str, service_role_key: str, user_token: str | None = None):
        self.base_url = url.rstrip("/")
        self.user_headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {user_token or ''}",
            "Content-Type": "application/json",
        }
        self.service_headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
        }
        self.timeout = httpx.Timeout(15, connect=5)

    async def get_user(self) -> UserContext:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(f"{self.base_url}/auth/v1/user", headers=self.user_headers)
        self._raise_for_status(response, "Could not read authenticated user.")
        payload = response.json()
        return UserContext(id=payload["id"], email=payload.get("email"))

    async def get_or_create_profile(self, user: UserContext) -> dict:
        profiles = await self._select(
            "profiles",
            f"id=eq.{quote(user.id)}&select=id,email,plan,tasks_used_this_month",
        )
        if profiles:
            return profiles[0]

        created = await self._insert(
            "profiles",
            {
                "id": user.id,
                "email": user.email,
                "plan": "free",
                "tasks_used_this_month": 0,
            },
        )
        return created[0]

    async def get_profile_by_stripe_customer(self, customer_id: str) -> dict | None:
        profiles = await self._select(
            "profiles",
            f"stripe_customer_id=eq.{quote(customer_id)}&select=id,email,plan,stripe_customer_id",
        )
        return profiles[0] if profiles else None

    async def create_task(self, user_id: str, title: str) -> dict:
        return (
            await self._insert(
                "tasks",
                {"user_id": user_id, "title": title, "status": "pending"},
            )
        )[0]

    async def create_steps(self, task_id: str, steps: list[str]) -> list[dict]:
        step_rows = [
            {
                "task_id": task_id,
                "step_order": index + 1,
                "description": description,
                "status": "pending",
            }
            for index, description in enumerate(steps)
        ]
        return await self._insert("task_steps", step_rows)

    async def get_task(self, user_id: str, task_id: str) -> dict | None:
        tasks = await self._select(
            "tasks",
            (
                f"id=eq.{quote(task_id)}&user_id=eq.{quote(user_id)}"
                "&select=id,title,status,task_steps(id,step_order,description,status)"
            ),
        )
        return tasks[0] if tasks else None

    async def update_step_status(self, task_id: str, step_id: str, step_status: str) -> None:
        await self._patch(
            "task_steps",
            f"id=eq.{quote(step_id)}&task_id=eq.{quote(task_id)}",
            {"status": step_status},
        )

    async def update_task_status(self, task_id: str, task_status: str) -> None:
        await self._patch(
            "tasks",
            f"id=eq.{quote(task_id)}",
            {"status": task_status},
        )

    async def delete_task(self, task_id: str, user_id: str) -> None:
        await self._delete(
            "tasks",
            f"id=eq.{quote(task_id)}&user_id=eq.{quote(user_id)}",
        )

    async def add_activity(self, user_id: str, task_id: str | None, message: str) -> None:
        await self._insert(
            "agent_activity",
            {
                "user_id": user_id,
                "task_id": task_id,
                "message": message,
            },
        )

    async def get_gmail_connection(self, user_id: str) -> dict | None:
        connections = await self._select(
            "gmail_connections",
            f"user_id=eq.{quote(user_id)}&select=user_id,email,encrypted_refresh_token",
        )
        return connections[0] if connections else None

    async def upsert_gmail_connection(
        self,
        user_id: str,
        email: str,
        encrypted_refresh_token: str,
    ) -> None:
        headers = {
            **self.service_headers,
            "Prefer": "resolution=merge-duplicates,return=minimal",
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/rest/v1/gmail_connections",
                headers=headers,
                json={
                    "user_id": user_id,
                    "email": email,
                    "encrypted_refresh_token": encrypted_refresh_token,
                    "updated_at": datetime.now(UTC).isoformat(),
                },
            )
        self._raise_for_status(response, "Could not save Gmail connection.")

    async def delete_gmail_connection(self, user_id: str) -> None:
        await self._delete("gmail_connections", f"user_id=eq.{quote(user_id)}")

    async def update_profile_billing(
        self,
        user_id: str,
        plan: str | None = None,
        stripe_customer_id: str | None = None,
    ) -> None:
        payload: dict[str, str] = {}
        if plan is not None:
            payload["plan"] = plan
        if stripe_customer_id is not None:
            payload["stripe_customer_id"] = stripe_customer_id
        if payload:
            await self._patch("profiles", f"id=eq.{quote(user_id)}", payload)

    async def consume_task_quota(
        self,
        user_id: str,
        current_usage: int,
        plan: str,
        free_limit: int = 5,
    ) -> int:
        try:
            result = await self._rpc(
                "consume_task_quota",
                {"target_user_id": user_id, "free_limit": free_limit},
            )
            return int(result)
        except SupabaseError as error:
            if "consume_task_quota" not in str(error):
                raise

        if plan != "pro" and current_usage >= free_limit:
            raise SupabaseError("FREE_PLAN_LIMIT_REACHED")

        next_usage = current_usage + 1
        await self._patch(
            "profiles",
            f"id=eq.{quote(user_id)}",
            {"tasks_used_this_month": next_usage},
        )
        return next_usage

    async def _select(self, table: str, query: str) -> list[dict]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/rest/v1/{table}?{query}",
                headers=self.service_headers,
            )
        self._raise_for_status(response, f"Could not select {table}.")
        return response.json()

    async def _insert(self, table: str, payload: dict | list[dict]) -> list[dict]:
        headers = {**self.service_headers, "Prefer": "return=representation"}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/rest/v1/{table}",
                headers=headers,
                json=payload,
            )
        self._raise_for_status(response, f"Could not insert {table}.")
        return response.json()

    async def _patch(self, table: str, filters: str, payload: dict) -> None:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.patch(
                f"{self.base_url}/rest/v1/{table}?{filters}",
                headers=self.service_headers,
                json=payload,
            )
        self._raise_for_status(response, f"Could not update {table}.")

    async def _rpc(self, function: str, payload: dict) -> object:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/rest/v1/rpc/{function}",
                headers=self.service_headers,
                json=payload,
            )
        self._raise_for_status(response, f"Could not call {function}.")
        return response.json()

    async def _delete(self, table: str, filters: str) -> None:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.delete(
                f"{self.base_url}/rest/v1/{table}?{filters}",
                headers=self.service_headers,
            )
        self._raise_for_status(response, f"Could not delete {table}.")

    @staticmethod
    def _raise_for_status(response: httpx.Response, fallback: str) -> None:
        if response.status_code < 400:
            return
        try:
            detail = response.json().get("message") or response.text
        except ValueError:
            detail = response.text
        raise SupabaseError(detail or fallback)
