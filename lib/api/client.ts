const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";

type ApiRequestOptions = RequestInit & {
  accessToken?: string;
  timeoutMs?: number;
};

export async function apiRequest<T>(
  path: string,
  { accessToken, timeoutMs = 60000, headers, ...options }: ApiRequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const detail =
        payload && typeof payload === "object" && "detail" in payload
          ? String(payload.detail)
          : `Request failed with status ${response.status}.`;
      throw new Error(detail);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The request timed out. Please try again.");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}
