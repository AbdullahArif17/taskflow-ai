from fastapi import Header, HTTPException, status


def require_access_token(authorization: str | None = Header(default=None)) -> str:
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Supabase access token.",
        )
    return token.strip()
