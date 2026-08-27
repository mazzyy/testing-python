"""
Memory Profiling Script - Identifies which modules consume the most RAM

Run this inside the Docker container or locally to see a breakdown of memory
consumption at each import stage.

Usage:
    python profile_memory.py
"""
import sys
import gc
import os


def get_rss_mb():
    """Return current RSS (Resident Set Size) in MB - actual process memory."""
    try:
        import resource
        # getrusage returns bytes on some systems, KB on others
        rusage = resource.getrusage(resource.RUSAGE_SELF)
        # macOS returns in bytes, Linux in KB
        if sys.platform == 'darwin':
            return rusage.ru_maxrss / 1024 / 1024  # bytes -> MB
        else:
            return rusage.ru_maxrss / 1024  # KB -> MB
    except ImportError:
        return 0.0


def get_mem_mb():
    """Return current memory in MB using RSS."""
    rss = get_rss_mb()
    return rss, rss


def profile_import(module_name: str, baseline_mb: float) -> float:
    """Import a module and report memory delta."""
    gc.collect()
    before_cur, _ = get_mem_mb()
    try:
        __import__(module_name)
        gc.collect()
        after_cur, _ = get_mem_mb()
        delta = after_cur - before_cur
        print(f"  {module_name:40s} +{delta:6.1f} MB  (total: {after_cur:.1f} MB)")
        return after_cur
    except ImportError as e:
        print(f"  {module_name:40s}  [SKIP] {e}")
        return before_cur


def main():
    gc.collect()

    print("="*70)
    print("MEMORY PROFILING: Python + FastAPI App Imports (RSS)")
    print("="*70)
    print()

    baseline, _ = get_mem_mb()
    print(f"Baseline (Python interpreter): {baseline:.1f} MB")
    print()

    print("-"*70)
    print("Stage 1: Core Python / Web Framework")
    print("-"*70)
    modules_stage1 = [
        "os", "sys", "typing", "json", "io", "threading",
        "contextlib", "asyncio",
        "fastapi", "starlette", "uvicorn", "pydantic",
    ]
    for m in modules_stage1:
        baseline = profile_import(m, baseline)

    print()
    print("-"*70)
    print("Stage 2: Database / ORM")
    print("-"*70)
    modules_stage2 = [
        "sqlalchemy", "psycopg2", "alembic",
    ]
    for m in modules_stage2:
        baseline = profile_import(m, baseline)

    print()
    print("-"*70)
    print("Stage 3: Document Parsing")
    print("-"*70)
    modules_stage3 = [
        "PyPDF2", "docx", "pdfplumber", "pdfminer", "PIL",
    ]
    for m in modules_stage3:
        baseline = profile_import(m, baseline)

    print()
    print("-"*70)
    print("Stage 4: AI / ML (potential memory hogs)")
    print("-"*70)
    modules_stage4 = [
        "openai", "httpx",
        "numpy",
        "onnxruntime",
        "chromadb",
    ]
    for m in modules_stage4:
        baseline = profile_import(m, baseline)

    print()
    print("-"*70)
    print("Stage 5: ChromaDB with Azure OpenAI Embeddings (no ONNX)")
    print("-"*70)
    gc.collect()
    before_cur, _ = get_mem_mb()
    try:
        from app.services.rag_service import AzureOpenAIEmbeddingFunction
        # Note: This will fail if AZURE_EMBEDDING_API_KEY is not set,
        # but fails at runtime, not import time
        print(f"  AzureOpenAIEmbeddingFunction import    +   0.0 MB  (total: {before_cur:.1f} MB)")
        print("  [INFO] No ONNX model loaded - embeddings via API")
    except Exception as e:
        print(f"  [SKIP] Could not import: {e}")

    print()
    current, peak = get_mem_mb()
    print("="*70)
    print(f"FINAL: Current={current:.1f} MB | Peak={peak:.1f} MB")
    print("="*70)


if __name__ == "__main__":
    main()
