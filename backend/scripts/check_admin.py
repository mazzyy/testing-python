#!/usr/bin/env python3
"""
Diagnose an admin login failure.

Lists every user in the database the API is actually using, and tests a
candidate password against each one through the same verify_password() the
login endpoint calls.

Usage:
    cd backend
    python -m scripts.check_admin --password 'admin8084' \
        --db-url "postgresql://uniadvisor:uniadvisor_password@localhost:5433/uniadvisor_db"
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
    ap.add_argument("--password", help="Password to test against each account")
    ap.add_argument("--db-url", help="Database URL (overrides DATABASE_URL)")
    args = ap.parse_args()

    if args.db_url:
        os.environ["DATABASE_URL"] = args.db_url

    from app.config import settings
    from app.database import SessionLocal
    from app.models.user import User
    from app.auth import verify_password

    shown = settings.DATABASE_URL
    if "@" in shown:
        head, tail = shown.split("@", 1)
        shown = head.split("//")[0] + "//***:***@" + tail
    print(f"[DB] {shown}\n")

    db = SessionLocal()
    try:
        users = db.query(User).all()
        if not users:
            print("[!] No users at all. Start the API once with ADMIN_PASSWORD set in .env.")
            return 1

        print(f"{'id':<4} {'email':<32} {'role':<10} {'active':<7} {'hash len':<9} match")
        print("-" * 78)
        for u in users:
            role = getattr(u.role, "value", u.role)
            h = u.hashed_password or ""
            match = ""
            if args.password:
                try:
                    match = "YES" if verify_password(args.password, h) else "no"
                except Exception as e:
                    match = f"err: {e}"
            print(f"{u.id:<4} {u.email:<32} {str(role):<10} {str(u.is_active):<7} {len(h):<9} {match}")

        print("\nNotes:")
        print("  hash len must be 96 (32 salt + 64 sha256). Anything else = stale format.")
        print("  email match is case-sensitive and exact — watch for stray spaces.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
