"""
Ad-hoc health check for all Azure-dependent services.

Run:  python check_azure_health.py
Verifies: (1) Azure OpenAI chat, (2) Azure OpenAI embeddings,
          (3) RAG / ChromaDB semantic search.
"""
import sys
import time
import traceback

results = []


def record(name, ok, detail=""):
    results.append((name, ok, detail))
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {name}" + (f" -> {detail}" if detail else ""))


print("=" * 70)
print("  AZURE + RAG HEALTH CHECK")
print("=" * 70)

# ---------------------------------------------------------------------------
# 0. Config sanity
# ---------------------------------------------------------------------------
try:
    from app.config import settings
    print(f"\nChat endpoint     : {settings.AZURE_OPENAI_ENDPOINT}")
    print(f"Chat deployment   : {settings.AZURE_OPENAI_DEPLOYMENT}  (api {settings.AZURE_OPENAI_API_VERSION})")
    print(f"Embed endpoint    : {settings.AZURE_EMBEDDING_ENDPOINT}")
    print(f"Embed deployment  : {settings.AZURE_EMBEDDING_DEPLOYMENT}  (api {settings.AZURE_EMBEDDING_API_VERSION})")
    print(f"Chat key set      : {bool(settings.AZURE_OPENAI_API_KEY)}")
    print(f"Embed key set     : {bool(settings.AZURE_EMBEDDING_API_KEY)}")
    print(f"Chroma path       : {settings.CHROMA_DB_PATH}")
    print("-" * 70)
except Exception as e:
    print(f"FATAL: could not load settings: {e}")
    sys.exit(1)

# ---------------------------------------------------------------------------
# 1. Azure OpenAI Chat completion
# ---------------------------------------------------------------------------
try:
    from app.services.azure_openai import get_azure_openai_service
    svc = get_azure_openai_service()
    t0 = time.time()
    reply = svc.generate_response(
        messages=[
            {"role": "system", "content": "You reply with a single word."},
            {"role": "user", "content": "Reply with exactly: PONG"},
        ],
        max_tokens=10,
    )
    dt = time.time() - t0
    ok = bool(reply and reply.strip())
    record("Azure OpenAI CHAT (gpt-5-mini)", ok, f"{dt:.1f}s, reply={reply!r}")
except Exception as e:
    record("Azure OpenAI CHAT (gpt-5-mini)", False, f"{type(e).__name__}: {e}")
    traceback.print_exc()

# ---------------------------------------------------------------------------
# 2. Azure OpenAI Embeddings (direct, same path RAG uses)
# ---------------------------------------------------------------------------
try:
    from app.services.rag_service import AzureOpenAIEmbeddingFunction
    ef = AzureOpenAIEmbeddingFunction()
    t0 = time.time()
    vecs = ef(["data science masters germany", "mechanical engineering phd"])
    dt = time.time() - t0
    ok = bool(vecs) and len(vecs) == 2 and len(vecs[0]) > 0
    record("Azure OpenAI EMBEDDINGS (text-embedding-3-small)", ok,
           f"{dt:.1f}s, {len(vecs)} vectors, dim={len(vecs[0]) if vecs else 0}")
except Exception as e:
    record("Azure OpenAI EMBEDDINGS (text-embedding-3-small)", False, f"{type(e).__name__}: {e}")
    traceback.print_exc()

# ---------------------------------------------------------------------------
# 3. RAG / ChromaDB semantic search
# ---------------------------------------------------------------------------
try:
    from app.services.rag_service import get_rag_service, CHROMADB_AVAILABLE
    from app.database import SessionLocal
    if not CHROMADB_AVAILABLE:
        record("RAG / ChromaDB semantic search", False, "chromadb package not installed")
    else:
        rag = get_rag_service()
        db = SessionLocal()
        try:
            ready = rag._ensure_chromadb()
            indexed = rag.collection.count() if (ready and rag.collection) else 0
            t0 = time.time()
            hits = rag.search_programs(query="artificial intelligence masters", n_results=5, db=db)
            dt = time.time() - t0
            vec_hits = [h for h in hits if h.get("source") == "vector"]
            ok = ready and indexed > 0 and len(hits) > 0
            detail = (f"{dt:.1f}s, chroma_ready={ready}, indexed={indexed}, "
                      f"hits={len(hits)} (vector={len(vec_hits)})")
            record("RAG / ChromaDB semantic search", ok, detail)
            if hits:
                print("      sample:", hits[0].get("program_name"), "|", hits[0].get("university_name"))
        finally:
            db.close()
except Exception as e:
    record("RAG / ChromaDB semantic search", False, f"{type(e).__name__}: {e}")
    traceback.print_exc()

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("=" * 70)
passed = sum(1 for _, ok, _ in results if ok)
print(f"  RESULT: {passed}/{len(results)} checks passed")
for name, ok, _ in results:
    print(f"    {'✓' if ok else '✗'} {name}")
print("=" * 70)
sys.exit(0 if passed == len(results) else 1)
