import { apiRequest } from "@/lib/api/client";

type CheckoutResponse = {
  url: string;
};

export async function createCheckoutSession(accessToken: string): Promise<CheckoutResponse> {
  return apiRequest<CheckoutResponse>("/billing/checkout", {
    method: "POST",
    accessToken,
    timeoutMs: 30000,
  });
}
