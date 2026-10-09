"""
Create the admin credentials for the portal.

Run from the project root:   python -m backend.app.create_admin_credentials

It asks for the admin email and password (the password is typed hidden, never
echoed or stored) and prints three lines to paste into your .env file.
"""

import getpass
import secrets

from backend.app.security import hash_password


def main():
    email = input("Admin email: ").strip().lower()
    password = getpass.getpass("Admin password (min 12 characters): ")
    confirm = getpass.getpass("Repeat password: ")

    if not email or "@" not in email:
        raise SystemExit("Please enter a valid email.")
    if len(password) < 12:
        raise SystemExit("Password must be at least 12 characters.")
    if password != confirm:
        raise SystemExit("Passwords do not match.")

    print("\nAdd these lines to your .env file (keep the single quotes):\n")
    print(f"ADMIN_EMAIL='{email}'")
    print(f"ADMIN_PASSWORD_HASH='{hash_password(password)}'")
    print(f"ADMIN_TOKEN_SECRET='{secrets.token_urlsafe(48)}'")
    print("\nThen restart the backend. Never commit .env.")


if __name__ == "__main__":
    main()
