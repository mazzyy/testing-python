#!/usr/bin/env python3
"""
Test AI Recommendations Pipeline
=================================
Tests the full recommendation flow:
  1. Embedding API connectivity (Azure OpenAI text-embedding-3-small)
  2. ChromaDB / RAG search with a rough profile
  3. AI match score calculation (Azure OpenAI GPT)

Usage:
    cd backend
    python -m scripts.test_recommendations
"""

import sys
import os
import json
import time

# Ensure the backend package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import settings
from app.database import SessionLocal
from app.services.rag_service import get_rag_service
from app.services.azure_openai import get_azure_openai_service

# ─── Rough test profile ───────────────────────────────────────────────
TEST_PROFILE = {
    "current_degree": "Bachelor",
    "field_of_study": "Computer Science",
    "university": "COMSATS University",
    "cgpa": 3.2,
    "gpa_scale": 4.0,
    "english_level": "C1",
    "german_level": "A1",
    "desired_degree": "Masters",
    "desired_fields": ["Computer Science", "Data Science", "Artificial Intelligence"],
    "preferred_language": "English",
    "nationality": "Pakistan",
    "preferred_cities": ["Berlin", "Munich"],
}

# A minimal profile (only secondary fields filled)
MINIMAL_PROFILE = {
    "current_degree": "Bachelor",
    "cgpa": 3.5,
    "gpa_scale": 4.0,
    "english_level": "B2",
}


def separator(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def test_embedding_api():
    """Test 1: Verify Azure OpenAI Embedding API is reachable."""
    separator("TEST 1: Embedding API Connectivity")

    print(f"  Endpoint:   {settings.AZURE_EMBEDDING_ENDPOINT}")
    print(f"  Deployment: {settings.AZURE_EMBEDDING_DEPLOYMENT}")
    print(f"  API Key:    {'***' + settings.AZURE_EMBEDDING_API_KEY[-4:] if settings.AZURE_EMBEDDING_API_KEY else 'NOT SET'}")
    print()

    from app.services.rag_service import AzureOpenAIEmbeddingFunction

    try:
        ef = AzureOpenAIEmbeddingFunction()
        test_texts = ["Masters in Computer Science in Germany"]
        
        start = time.time()
        embeddings = ef(test_texts)
        elapsed = time.time() - start

        if embeddings and len(embeddings) > 0:
            dim = len(embeddings[0])
            print(f"  ✅ Embedding API works!")
            print(f"     Dimension: {dim}")
            print(f"     Latency:   {elapsed:.2f}s")
            print(f"     First 5 values: {embeddings[0][:5]}")
            return True
        else:
            print("  ❌ Embedding API returned empty result")
            return False
    except Exception as e:
        print(f"  ❌ Embedding API error: {e}")
        return False


def test_rag_search(db):
    """Test 2: RAG search using the rough profile."""
    separator("TEST 2: RAG Search (Full Profile)")

    rag = get_rag_service()

    # Index programs if not already done
    print("  Ensuring programs are indexed...")
    rag.index_programs(db)
    
    if rag.collection:
        print(f"  Collection count: {rag.collection.count()} programs")
    
    # Build search query from profile (same logic as recommendations.py)
    search_query = f"{TEST_PROFILE['desired_degree']} degree {' '.join(TEST_PROFILE['desired_fields'][:3])}"
    print(f"\n  Search query: \"{search_query}\"")

    start = time.time()
    results = rag.search_programs(
        query=search_query,
        n_results=5,
        degree_type="Masters",
        db=db,
    )
    elapsed = time.time() - start

    if results:
        print(f"\n  ✅ Found {len(results)} programs ({elapsed:.2f}s)")
        for i, r in enumerate(results[:5], 1):
            print(f"\n  [{i}] {r.get('program_name', 'N/A')}")
            print(f"      University: {r.get('university_name', 'N/A')}")
            print(f"      Degree:     {r.get('degree_type', r.get('degree', 'N/A'))}")
            print(f"      City:       {r.get('city', 'N/A')}")
            print(f"      Language:   {r.get('teaching_language', 'N/A')}")
            print(f"      Source:     {r.get('source', 'N/A')}")
            print(f"      DB ID:      {r.get('db_id', 'N/A')}")
        return results
    else:
        print(f"  ❌ No programs found ({elapsed:.2f}s)")
        return []


def test_rag_search_minimal(db):
    """Test 3: RAG search with minimal profile (only secondary fields)."""
    separator("TEST 3: RAG Search (Minimal Profile)")

    rag = get_rag_service()

    # Build a search from minimal profile using the fallback logic
    degree_progression = {"Bachelor": "Masters", "Masters": "PhD", "PhD": "PhD"}
    next_degree = degree_progression.get(MINIMAL_PROFILE.get("current_degree", ""), "Masters")
    search_query = f"{next_degree} degree university program Germany"

    print(f"  Minimal profile: {json.dumps(MINIMAL_PROFILE, indent=4)}")
    print(f"  Inferred search: \"{search_query}\"")

    start = time.time()
    results = rag.search_programs(
        query=search_query,
        n_results=5,
        degree_type=next_degree,
        db=db,
    )
    elapsed = time.time() - start

    if results:
        print(f"\n  ✅ Found {len(results)} programs ({elapsed:.2f}s)")
        for i, r in enumerate(results[:3], 1):
            print(f"  [{i}] {r.get('program_name', 'N/A')} @ {r.get('university_name', 'N/A')}")
        return True
    else:
        print(f"  ❌ No programs found with minimal profile ({elapsed:.2f}s)")
        return False


def test_match_score(search_results):
    """Test 4: AI match score calculation."""
    separator("TEST 4: AI Match Score (GPT)")

    ai = get_azure_openai_service()
    print(f"  Model: {ai.model}")
    print(f"  Endpoint: {settings.AZURE_OPENAI_ENDPOINT}")

    if not search_results:
        print("  ⚠️  No search results to score, skipping")
        return False

    # Pick top result
    top = search_results[0]
    program_data = {
        "program_name": top.get("program_name", "N/A"),
        "degree": top.get("degree_type", top.get("degree", "N/A")),
        "university_name": top.get("university_name", "N/A"),
        "teaching_language": top.get("teaching_language", "N/A"),
        "academic_admission_requirements": top.get("academic_admission_requirements", "N/A"),
        "language_requirements": top.get("language_requirements", "N/A"),
    }

    print(f"\n  Scoring: {program_data['program_name']} @ {program_data['university_name']}")
    print(f"  Profile: {TEST_PROFILE['desired_degree']} in {TEST_PROFILE['field_of_study']}")
    print(f"           GPA {TEST_PROFILE['cgpa']}/{TEST_PROFILE['gpa_scale']}, English {TEST_PROFILE['english_level']}")

    start = time.time()
    result = ai.calculate_match_score(TEST_PROFILE, program_data)
    elapsed = time.time() - start

    if result:
        print(f"\n  ✅ Match score calculated ({elapsed:.2f}s)")
        print(f"     Score:    {result.get('match_score', 'N/A')}%")
        print(f"     Reasons:  {json.dumps(result.get('match_reasons', []), indent=14)}")
        print(f"     Concerns: {json.dumps(result.get('concerns', []), indent=14)}")
        print(f"     Advice:   {result.get('recommendation', 'N/A')}")
        return True
    else:
        print(f"  ❌ Match score failed ({elapsed:.2f}s)")
        return False


def main():
    print("\n" + "🧪 " * 20)
    print("  UniAdvisorAI — AI Recommendation Pipeline Test")
    print("🧪 " * 20)

    db = SessionLocal()
    results_summary = {}

    try:
        # Test 1: Embedding API
        results_summary["embedding_api"] = test_embedding_api()

        # Test 2: RAG search with full profile
        search_results = test_rag_search(db)
        results_summary["rag_full_profile"] = len(search_results) > 0

        # Test 3: RAG search with minimal profile
        results_summary["rag_minimal_profile"] = test_rag_search_minimal(db)

        # Test 4: AI match score
        results_summary["match_score"] = test_match_score(search_results)

    except Exception as e:
        print(f"\n  💥 Unexpected error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

    # Summary
    separator("RESULTS SUMMARY")
    all_pass = True
    for name, passed in results_summary.items():
        icon = "✅" if passed else "❌"
        print(f"  {icon}  {name}")
        if not passed:
            all_pass = False

    print()
    if all_pass:
        print("  🎉 All tests passed! The recommendation pipeline is working.")
    else:
        print("  ⚠️  Some tests failed. Check the output above for details.")
    print()


if __name__ == "__main__":
    main()
