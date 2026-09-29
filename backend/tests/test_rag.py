"""Tests for the standalone RAG service: chunker, TF-IDF store, and pipeline."""

from pathlib import Path

import pytest

from app.ai.rag import (
    NO_ANSWER_MESSAGE,
    RagAnswer,
    RagPipeline,
    answer_question,
    ingest_docs,
)
from app.ai.rag.chunker import Chunk, chunk_markdown
from app.ai.rag.store import TfidfStore, tokenize

DOC = """# Work From Home Policy

Intro paragraph about the work from home policy and its purpose.

## 2. Limits

- Maximum two WFH days per calendar week.
- Maximum three consecutive WFH days.

## 3. Approval flow

Requests are raised in the HRMS and routed to the reporting manager for approval.
"""


def test_chunk_markdown_returns_chunks():
    chunks = chunk_markdown(DOC, source="wfh-policy.md", doc_id="wfh-policy")

    assert len(chunks) >= 3


def test_chunks_respect_size_and_keep_text():
    chunks = chunk_markdown(DOC, source="wfh-policy.md", doc_id="wfh-policy")

    for chunk in chunks:
        assert chunk.text.strip()
        assert chunk.doc_id == "wfh-policy"
        assert chunk.source == "wfh-policy.md"


def test_chunk_text_stays_near_configured_size():
    text = " ".join(f"sentence number {i} about policy content." for i in range(200))

    chunks = chunk_markdown(text, source="long.md", doc_id="long", chunk_size=500)

    assert len(chunks) > 1
    assert all(len(chunk.text) <= 500 for chunk in chunks)


def test_large_sections_split_with_overlap():
    body = " ".join(f"clause {i} describes the approval flow for requests." for i in range(120))
    text = f"# Title\n\n## 1. Approval\n\n{body}\n"

    chunks = chunk_markdown(text, source="overlap.md", doc_id="overlap")

    assert len(chunks) > 1
    first_tail = chunks[0].text.split()[-5:]
    second_head = chunks[1].text.split()[:5]
    assert first_tail == second_head


def test_chunks_record_section_heading():
    chunks = chunk_markdown(DOC, source="wfh-policy.md", doc_id="wfh-policy")

    headings = [chunk.heading for chunk in chunks]

    assert "2. Limits" in headings
    assert "3. Approval flow" in headings


def test_chunk_ids_are_unique_and_stable():
    first = chunk_markdown(DOC, source="wfh-policy.md", doc_id="wfh-policy")
    second = chunk_markdown(DOC, source="wfh-policy.md", doc_id="wfh-policy")

    ids = [chunk.chunk_id for chunk in first]

    assert len(set(ids)) == len(ids)
    assert ids == [chunk.chunk_id for chunk in second]


def test_chunk_index_follows_document_order():
    chunks = chunk_markdown(DOC, source="wfh-policy.md", doc_id="wfh-policy")

    assert [chunk.index for chunk in chunks] == list(range(len(chunks)))


def test_empty_document_produces_no_chunks():
    assert chunk_markdown("   \n\n  ", source="empty.md", doc_id="empty") == []


def _chunk(text: str, doc_id: str, source: str, index: int) -> Chunk:
    return Chunk(
        chunk_id=f"{doc_id}-{index}",
        doc_id=doc_id,
        source=source,
        heading=doc_id,
        text=text,
        index=index,
    )


WFH_CHUNK = _chunk(
    "Maximum two WFH days per calendar week. Maximum three consecutive WFH days.",
    "wfh-policy",
    "wfh-policy.md",
    0,
)
LEAVE_CHUNK = _chunk(
    "Casual leave must be applied at least one day in advance to the reporting manager.",
    "leave-policy",
    "leave-policy.md",
    0,
)


def _store() -> TfidfStore:
    store = TfidfStore()
    store.add_many([WFH_CHUNK, LEAVE_CHUNK])
    return store


def test_search_ranks_matching_chunk_first():
    results = _store().search("WFH days per week", top_k=2)

    assert results
    assert results[0].chunk.source == "wfh-policy.md"
    assert results[0].score > 0


def test_search_scores_are_descending():
    results = _store().search("leave request manager", top_k=5)

    assert [result.score for result in results] == sorted(
        (result.score for result in results), reverse=True
    )


def test_search_top_k_limits_results():
    assert len(_store().search("WFH leave", top_k=1)) == 1


def test_search_on_empty_index_returns_no_results():
    assert TfidfStore().search("work from home", top_k=3) == []


def test_search_is_deterministic():
    store = _store()

    first = store.search("WFH days per week", top_k=2)
    second = store.search("WFH days per week", top_k=2)

    assert [r.chunk.chunk_id for r in first] == [r.chunk.chunk_id for r in second]
    assert [r.score for r in first] == [r.score for r in second]


def test_search_ignores_common_words():
    assert _store().search("the and of", top_k=2) == []


def test_search_filters_by_allowed_documents():
    store = _store()

    blocked = store.search("WFH days per week", top_k=3, allowed_docs={"leave-policy"})
    permitted = store.search("WFH days per week", top_k=3, allowed_docs={"wfh-policy"})

    assert blocked == []
    assert [result.chunk.source for result in permitted] == ["wfh-policy.md"]


def test_search_min_score_filters_weak_matches():
    results = _store().search("WFH days per week", top_k=3, min_score=0.99)

    assert results == []


def test_add_replaces_document_content():
    store = TfidfStore()
    store.add_many([WFH_CHUNK, LEAVE_CHUNK])
    store.add_many([_chunk("Updated leave rules for casual leave.", "leave-policy", "leave-policy.md", 0)])

    assert len(store) == 2
    assert store.search("casual leave", top_k=1)[0].chunk.text.startswith("Updated")


def test_remove_document_drops_its_chunks():
    store = _store()
    store.remove_document("wfh-policy")

    assert len(store) == 1
    assert store.search("WFH days per week", top_k=3) == []
    assert store.search("casual leave manager", top_k=3)[0].chunk.source == "leave-policy.md"


def test_save_and_load_round_trip(tmp_path):
    path = tmp_path / "index.json"
    _store().save(path)

    loaded = TfidfStore.load(path)

    assert len(loaded) == 2
    assert loaded.search("WFH days per week", top_k=1)[0].chunk.source == "wfh-policy.md"


def test_load_missing_file_returns_empty_store(tmp_path):
    assert len(TfidfStore.load(tmp_path / "absent.json")) == 0


# --- pipeline over the real seed policy corpus -------------------------------

SEED_POLICIES_DIR = Path(__file__).resolve().parents[1] / "seed_policies"


@pytest.fixture(scope="module")
def pipeline() -> RagPipeline:
    return RagPipeline(ingest_docs(SEED_POLICIES_DIR))


def test_ingest_docs_loads_every_seed_policy(pipeline):
    assert pipeline.document_ids == {
        "attendance-policy",
        "benefits",
        "code-of-conduct",
        "leave-policy",
        "travel-policy",
        "wfh-policy",
    }


def test_ingest_docs_produces_chunks_from_all_documents(pipeline):
    sources = {chunk.source for chunk in pipeline.store.chunks}

    assert sources == {path.name for path in SEED_POLICIES_DIR.glob("*.md")}
    assert len(pipeline.store) >= 6


def test_answer_ranks_wfh_chunk_first_for_wfh_question(pipeline):
    answer = pipeline.answer("What is the company work-from-home policy?", top_k=3)

    assert answer.results
    assert answer.results[0].chunk.source == "wfh-policy.md"
    assert answer.top_source == "wfh-policy.md"


def test_answer_cites_the_retrieved_source(pipeline):
    answer = pipeline.answer("How many WFH days are allowed per week?", top_k=2)

    assert "wfh-policy.md" in answer.answer
    assert "wfh-policy.md" in answer.citations


def test_answer_grounded_in_chunk_text(pipeline):
    answer = pipeline.answer("How many WFH days are allowed per week?", top_k=1)
    top_text = answer.results[0].chunk.text

    assert any(fragment in top_text for fragment in answer.answer)


def test_unrelated_question_returns_low_scores(pipeline):
    answer = pipeline.answer(
        "What is the airspeed velocity of an unladen swallow in Patagonia?", top_k=3
    )

    assert answer.results == []
    assert answer.answer == NO_ANSWER_MESSAGE


def test_answer_is_deterministic(pipeline):
    question = "What is the work-from-home approval flow?"

    first = pipeline.answer(question, top_k=3)
    second = pipeline.answer(question, top_k=3)

    assert first.answer == second.answer
    assert [r.chunk.chunk_id for r in first.results] == [r.chunk.chunk_id for r in second.results]
    assert [r.score for r in first.results] == [r.score for r in second.results]


def test_answer_respects_allowed_documents(pipeline):
    answer = pipeline.answer(
        "What is the work-from-home policy?", top_k=3, allowed_docs={"leave-policy"}
    )

    assert all(result.chunk.source == "leave-policy.md" for result in answer.results)


def test_answer_respects_top_k(pipeline):
    answer = pipeline.answer("leave and attendance rules", top_k=2)

    assert len(answer.results) <= 2


def test_ingest_docs_persists_and_reloads_index(tmp_path):
    index_path = tmp_path / "index.json"

    ingest_docs(SEED_POLICIES_DIR, index_path=index_path)
    reloaded = RagPipeline(TfidfStore.load(index_path))

    assert len(reloaded.store) >= 6
    assert reloaded.answer("WFH approval flow", top_k=1).top_source == "wfh-policy.md"


def test_ingest_docs_reingestion_is_idempotent(pipeline):
    before = len(pipeline.store)

    pipeline.ingest(SEED_POLICIES_DIR)

    assert len(pipeline.store) == before


def test_answer_respects_min_relevance_score(pipeline):
    answer = pipeline.answer("WFH core collaboration hours", top_k=3, min_score=0.99)

    assert answer.results == []
    assert answer.answer == NO_ANSWER_MESSAGE


def test_module_level_answer_uses_seed_policies_by_default():
    answer = answer_question("What is the work-from-home policy?", top_k=2)

    assert answer.top_source == "wfh-policy.md"


# --- tokenization ------------------------------------------------------------


def test_tokenize_drops_stopwords_and_lowercases():
    assert tokenize("The WFH days are NOT counted") == ["wfh", "days", "counted"]


def test_tokenize_matches_plural_ies_forms():
    assert tokenize("policies") == tokenize("policy")


def test_tokenize_keeps_short_words_intact():
    assert tokenize("is it HR") == ["hr"]


def test_chunks_start_at_sentence_boundaries():
    body = " ".join(f"This is sentence {i} of the policy body." for i in range(60))

    chunks = chunk_markdown(body, source="sentences.md", doc_id="sentences", chunk_overlap=0)

    assert len(chunks) > 1
    for chunk in chunks:
        assert chunk.text[0].isupper(), chunk.text[:40]


def test_markdown_table_rows_are_not_split_across_chunks():
    table = "\n".join(f"| Leave type {i} | Entitlement of {i} days | Basis monthly |" for i in range(12))

    chunks = chunk_markdown(
        table, source="table.md", doc_id="table", chunk_size=200, chunk_overlap=0
    )

    assert len(chunks) > 1
    for chunk in chunks:
        assert chunk.text.count("|") % 4 == 0, chunk.text
