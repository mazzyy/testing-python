#!/usr/bin/env python3
"""
Create an admin account, or promote/repair an existing one.

Needed because create_default_admin() only runs at startup and only when no
admin exists — and it silently skipped for every previous run, since it read
ADMIN_PASSWORD from os.environ while .env is only ever parsed by pydantic.

Usage:
    cd backend
    python -m scripts.create_admin --email admin@daad.de --password 'admin8084' \
        --db-url "postgresql://uniadvisor:uniadvisor_password@localhost:5433/uniadvisor_db"

If the email already exists it is promoted to admin and its password reset,
so this is safe to re-run.
"""

import os
import sys
import argparse
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

load_dotenv(backend_dir / ".env")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", required=True)
    ap.add_argument("--password", required=True)
    ap.add_argument("--username", default="admin")
    ap.add_argument("--db-url")
    args = ap.parse_args()

    if args.db_url:
        os.environ["DATABASE_URL"] = args.db_url

    from app.database import SessionLocal
    from app.models.user import User, UserRole
    from app.auth import get_password_hash, verify_password

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == args.email).first()

        if user:
            user.hashed_password = get_password_hash(args.password)
            user.role = UserRole.ADMIN
            user.is_active = True
            user.is_verified = True
            action = "promoted existing account to admin"
        else:
            # username has a uniqueness constraint — don't collide
            uname = args.username
            n = 1
            while db.query(User).filter(User.username == uname).first():
                n += 1
                uname = f"{args.username}{n}"

            user = User(
                email=args.email,
                username=uname,
                hashed_password=get_password_hash(args.password),
                full_name="System Administrator",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            action = "created new admin account"

        db.commit()
        db.refresh(user)

        if not verify_password(args.password, user.hashed_password):
            print("[ERROR] Written, but the password failed verification.")
            return 1

        print(f"[OK] {action}")
        print(f"     email    : {user.email}")
        print(f"     username : {user.username}")
        print(f"     role     : {getattr(user.role, 'value', user.role)}")
        print(f"     active   : {user.is_active}")
        print("[OK] Verified through the same check the login endpoint uses.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
