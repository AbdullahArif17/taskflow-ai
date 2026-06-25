"use client";

import { FormEvent, useEffect, useState } from "react";
import { Link2, Loader2, Mail, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  connectGmail,
  createGmailDraft,
  disconnectGmail,
  getGmailStatus,
  type GmailStatus,
} from "@/lib/integrations/gmail";
import { createClient } from "@/lib/supabase/client";

async function accessToken() {
  const { data } = await createClient().auth.getSession();
  if (!data.session) throw new Error("Your session expired. Sign in again.");
  return data.session.access_token;
}

export function GmailIntegrationCard() {
  const [status, setStatus] = useState<GmailStatus>({ configured: true, connected: false, email: null });
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    void getGmailStatusForUser();
  }, []);

  async function getGmailStatusForUser() {
    try {
      setStatus(await getGmailStatus(await accessToken()));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load Gmail status.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnection() {
    setLoading(true);
    try {
      if (status.connected) {
        await disconnectGmail(await accessToken());
        setStatus({ configured: true, connected: false, email: null });
        toast.success("Gmail disconnected.");
      } else {
        const { url } = await connectGmail(await accessToken());
        window.location.assign(url);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update Gmail connection.");
      setLoading(false);
    }
  }

  async function handleDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDrafting(true);
    try {
      await createGmailDraft(await accessToken(), { to: recipient, subject, body });
      setRecipient("");
      setSubject("");
      setBody("");
      toast.success("Draft created in Gmail.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create Gmail draft.");
    } finally {
      setDrafting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="size-5 text-slate-500" />Gmail drafts</CardTitle>
        <CardDescription>Connect Gmail and create drafts without sending messages automatically.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 p-3">
          <div>
            <p className="text-sm font-medium">
              {!status.configured ? "Setup required" : status.connected ? "Connected" : "Not connected"}
            </p>
            {status.email ? <p className="text-xs text-slate-500">{status.email}</p> : null}
          </div>
          <Button disabled={loading || !status.configured} onClick={() => void handleConnection()} type="button" variant="outline">
            {loading ? <Loader2 className="animate-spin" /> : status.connected ? <Unlink /> : <Link2 />}
            {!status.configured ? "Configure backend" : status.connected ? "Disconnect" : "Connect Gmail"}
          </Button>
        </div>
        {status.connected ? (
          <form className="space-y-3" onSubmit={handleDraft}>
            <div className="space-y-2"><Label htmlFor="gmail-to">To</Label><Input id="gmail-to" onChange={(event) => setRecipient(event.target.value)} required type="email" value={recipient} /></div>
            <div className="space-y-2"><Label htmlFor="gmail-subject">Subject</Label><Input id="gmail-subject" maxLength={200} onChange={(event) => setSubject(event.target.value)} required value={subject} /></div>
            <div className="space-y-2">
              <Label htmlFor="gmail-body">Message</Label>
              <textarea className="min-h-32 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" id="gmail-body" maxLength={20000} onChange={(event) => setBody(event.target.value)} required value={body} />
            </div>
            <Button disabled={drafting} type="submit">{drafting ? <Loader2 className="animate-spin" /> : <Mail />}Create Gmail draft</Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
