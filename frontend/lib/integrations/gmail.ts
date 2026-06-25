import { apiRequest } from "@/lib/api/client";

export type GmailStatus = {
  configured: boolean;
  connected: boolean;
  email: string | null;
};

export function getGmailStatus(accessToken: string) {
  return apiRequest<GmailStatus>("/integrations/gmail/status", {
    accessToken,
    timeoutMs: 30000,
  });
}

export function connectGmail(accessToken: string) {
  return apiRequest<{ url: string }>("/integrations/gmail/connect", {
    method: "POST",
    accessToken,
    timeoutMs: 30000,
  });
}

export function disconnectGmail(accessToken: string) {
  return apiRequest<{ deleted: boolean }>("/integrations/gmail", {
    method: "DELETE",
    accessToken,
    timeoutMs: 30000,
  });
}

export function createGmailDraft(
  accessToken: string,
  payload: { to: string; subject: string; body: string },
) {
  return apiRequest<{ draft_id: string }>("/integrations/gmail/drafts", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
    timeoutMs: 30000,
  });
}
