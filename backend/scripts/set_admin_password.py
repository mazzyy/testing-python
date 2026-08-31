#!/usr/bin/env python3
"""
Set the admin account's password.

create_default_admin() in app/main.py only runs when NO admin row exists, so
changing ADMIN_PASSWORD in .env has no effect once the admin has been created.
This script updates the stored hash directly, using the same hashing the login
endpoint verifies against.

Usage:
    cd backend
    python -m scripts.set_admin_password --password 'newpassword'

    # against a specific database (e.g. when .env's port is wrong)
    python -m scripts.set_admin_password --password 'newpassword' \
        --db-url "postgresql://user:pass@localhost:5433/uniadvisor_db"

    # target a particular account instead of the first admin
    python -m scripts.set_admin_password --email admin@daad.de --password 'newpassword'
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
    parser = argparse.ArgumentParser(description="Set the admin password")
    parser.add_argument("--password", required=True, help="New plain-text password")
    parser.add_argument("--email", help="Target this email instead of the first admin found")
    parser.add_argument("--db-url", help="Database URL (overrides DATABASE_URL)")
    args = parser.parse_args()

    if args.db_url:
        os.environ["DATABASE_URL"] = args.db_url

    # Imported after DATABASE_URL is settled — app.config reads it at import time
    from app.database import SessionLocal
    from app.models.user import User, UserRole
    from app.auth import get_password_hash, verify_password

    db = SessionLocal()
    try:
        if args.email:
            user = db.query(User).filter(User.email == args.email).first()
            if not user:
                print(f"[ERROR] No user with email {args.email}")
                return 1
        else:
            user = db.query(User).filter(User.role == UserRole.ADMIN).first()
            if not user:
                print("[ERROR] No admin user found. Start the API once to create one.")
                return 1

        user.hashed_password = get_password_hash(args.password)
        db.commit()
        db.refresh(user)

        # Prove the new hash actually validates through the same path login uses
        if verify_password(args.password, user.hashed_password):
            print(f"[OK] Password updated for {user.email} (role={user.role.value})")
            print("[OK] Verified against the login hash check.")
            return 0

        print("[ERROR] Password was written but failed verification.")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
