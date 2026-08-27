#!/usr/bin/env python3
"""
Pre-build ChromaDB Index
========================
Indexes ALL programs and scholarships into ChromaDB so the
container starts with a fully populated vector database.

This script is called during `docker build` to bake the index
into the image. It can also be run locally:

    cd backend
    python -m scripts.build_chromadb_index

Required env vars:
    DATABASE_URL              - PostgreSQL connection string
    AZURE_EMBEDDING_ENDPOINT  - Azure embedding endpoint
    AZURE_EMBEDDING_API_KEY   - Azure embedding API key
    AZURE_EMBEDDING_DEPLOYMENT - Embedding model deployment name
"""

import sys
import os
import time
import argparse

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import settings
from app.database import SessionLocal
from app.services.rag_service import get_rag_service


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--resume', action='store_true', help='Resume from partial index (skip force reload)')
    args = parser.parse_args()
    force_reload = not args.resume
    print("\n" + "=" * 60)
    print("  ChromaDB Pre-Build Index")
    print("=" * 60)

    print(f"\n  Database:   {settings.DATABASE_URL[:40]}...")
    print(f"  Embedding:  {settings.AZURE_EMBEDDING_ENDPOINT}")
    print(f"  Deployment: {settings.AZURE_EMBEDDING_DEPLOYMENT}")
    print(f"  ChromaDB:   {settings.CHROMA_DB_PATH}")

    if not settings.AZURE_EMBEDDING_API_KEY:
        print("\n  ❌ AZURE_EMBEDDING_API_KEY not set — cannot build index")
        sys.exit(1)

    db = SessionLocal()

    try:
        rag = get_rag_service()

        # Force re-index programs
        print("\n\n--- Indexing Programs ---")
        start = time.time()
        program_count = rag.index_programs(db, force_reload=force_reload)
        elapsed = time.time() - start
        print(f"\n  ✅ Indexed {program_count} programs ({elapsed:.1f}s)")

        # Force re-index scholarships
        print("\n\n--- Indexing Scholarships ---")
        start = time.time()
        scholarship_count = rag.index_scholarships(db, force_reload=force_reload)
        elapsed = time.time() - start
        print(f"\n  ✅ Indexed {scholarship_count} scholarships ({elapsed:.1f}s)")

        print("\n" + "=" * 60)
        print(f"  ✅ ChromaDB index built successfully!")
        print(f"     Programs:     {program_count}")
        print(f"     Scholarships: {scholarship_count}")
        print(f"     Path:         {settings.CHROMA_DB_PATH}")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"\n  ❌ Error building index: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
