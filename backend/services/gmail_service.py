import base64
from email.message import EmailMessage

from cryptography.fernet import Fernet, InvalidToken
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.compose"]


class GmailConfigurationError(RuntimeError):
    pass


class GmailIntegrationError(RuntimeError):
    pass


def create_oauth_flow(client_id: str, client_secret: str, redirect_uri: str) -> Flow:
    return Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=GMAIL_SCOPES,
        redirect_uri=redirect_uri,
    )


def encrypt_refresh_token(refresh_token: str, key: str) -> str:
    try:
        return Fernet(key.encode()).encrypt(refresh_token.encode()).decode()
    except (ValueError, TypeError) as error:
        raise GmailConfigurationError("INTEGRATION_ENCRYPTION_KEY is invalid.") from error


def decrypt_refresh_token(encrypted_token: str, key: str) -> str:
    try:
        return Fernet(key.encode()).decrypt(encrypted_token.encode()).decode()
    except (InvalidToken, ValueError, TypeError) as error:
        raise GmailIntegrationError("Stored Gmail credentials could not be decrypted.") from error


def create_gmail_draft(
    *,
    client_id: str,
    client_secret: str,
    refresh_token: str,
    sender: str,
    recipient: str,
    subject: str,
    body: str,
) -> str:
    try:
        credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
            scopes=GMAIL_SCOPES,
        )
        credentials.refresh(Request())
        message = EmailMessage()
        message["To"] = recipient
        message["From"] = sender
        message["Subject"] = subject
        message.set_content(body)
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        service = build("gmail", "v1", credentials=credentials, cache_discovery=False)
        draft = service.users().drafts().create(userId="me", body={"message": {"raw": raw}}).execute()
        return str(draft["id"])
    except (GoogleAuthError, HttpError, KeyError) as error:
        raise GmailIntegrationError("Gmail rejected the draft request.") from error
