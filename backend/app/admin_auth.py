"""
Admin authentication (no database changes).

The single admin account is configured through environment variables (.env):

    ADMIN_EMAIL           admin login email
    ADMIN_PASSWORD_HASH   argon2 hash (create with: python -m backend.app.create_admin_credentials)
    ADMIN_TOKEN_SECRET    random secret (>= 32 chars) used to sign access tokens

If any of them is missing the admin portal is DISABLED: login returns 503 and
every protected endpoint returns 401 (fail closed).

Tokens are small signed JSON payloads (HMAC-SHA256) with an expiry. They are
sent as `Authorization: Bearer <token>`.
"""

import base64
import hashlib
import hmac
import json
import os
import threading
import time

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.app.security import verify_password

TOKEN_TTL_SECONDS = 8 * 60 * 60
MIN_SECRET_LENGTH = 32

LOGIN_MAX_FAILURES = 5
LOGIN_WINDOW_SECONDS = 15 * 60

bearer_scheme = HTTPBearer(auto_error=False)


def _settings() -> tuple[str | None, str | None, str | None]:
    return (
        (os.getenv("ADMIN_EMAIL") or "").strip().lower() or None,
        os.getenv("ADMIN_PASSWORD_HASH") or None,
        os.getenv("ADMIN_TOKEN_SECRET") or None,
    )


def admin_configured() -> bool:
    email, password_hash, secret = _settings()
    return bool(email and password_hash and secret and len(secret) >= MIN_SECRET_LENGTH)


def authenticate_admin(email: str, password: str) -> bool:
    configured_email, password_hash, _ = _settings()
    if not admin_configured():
        return False
    email_ok = hmac.compare_digest((email or "").strip().lower(), configured_email)
    # Always verify the password so timing does not reveal whether the email matched.
    try:
        password_ok = verify_password(password or "", password_hash)
    except Exception:
        password_ok = False
    return email_ok and password_ok


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _sign(payload_part: str, secret: str) -> str:
    return _b64(hmac.new(secret.encode(), payload_part.encode(), hashlib.sha256).digest())


def create_token(email: str, now: float | None = None) -> tuple[str, int]:
    _, _, secret = _settings()
    expires_at = int((now if now is not None else time.time()) + TOKEN_TTL_SECONDS)
    payload = _b64(json.dumps({"sub": email, "exp": expires_at}).encode())
    return f"{payload}.{_sign(payload, secret)}", expires_at


def verify_token(token: str, now: float | None = None) -> str | None:
    """Return the admin email if the token is valid and unexpired, else None."""
    if not admin_configured():
        return None
    _, _, secret = _settings()
    try:
        payload_part, signature = token.split(".", 1)
        if not hmac.compare_digest(signature, _sign(payload_part, secret)):
            return None
        payload = json.loads(_unb64(payload_part))
        if payload["exp"] < (now if now is not None else time.time()):
            return None
        if payload["sub"] != _settings()[0]:
            return None
        return payload["sub"]
    except Exception:
        return None


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    """FastAPI dependency: returns the admin email or raises 401."""
    email = verify_token(credentials.credentials) if credentials else None
    if email is None:
        raise HTTPException(
            status_code=401,
            detail="Admin authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return email


class LoginThrottle:
    """In-memory limit on failed logins per client (resets on restart)."""

    def __init__(self, max_failures=LOGIN_MAX_FAILURES, window=LOGIN_WINDOW_SECONDS):
        self.max_failures = max_failures
        self.window = window
        self._failures: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def _recent(self, key: str, now: float) -> list[float]:
        recent = [t for t in self._failures.get(key, []) if now - t < self.window]
        self._failures[key] = recent
        return recent

    def is_blocked(self, key: str, now: float | None = None) -> bool:
        now = now if now is not None else time.time()
        with self._lock:
            return len(self._recent(key, now)) >= self.max_failures

    def record_failure(self, key: str, now: float | None = None) -> None:
        now = now if now is not None else time.time()
        with self._lock:
            self._recent(key, now).append(now)

    def reset(self, key: str) -> None:
        with self._lock:
            self._failures.pop(key, None)


login_throttle = LoginThrottle()
