"""Optional FastAPI inference endpoint for AURA."""
import logging
from typing import Any

from fastapi import FastAPI, Query
from pydantic import BaseModel

from src.inference.recommend import recommend_tools

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AURA AI/ML API",
    description="AI tool discovery and recommendation API",
    version="0.1.0",
)


class RecommendRequest(BaseModel):
    query: str
    top_k: int = 5
    use_reranker: bool = False


class ToolResult(BaseModel):
    rank: int
    tool_id: str
    name: str
    category: str
    description: str
    url: str | None
    semantic_score: float
    reranker_score: float | None = None
    ranking_score: float | None = None
    reason: str


class RecommendResponse(BaseModel):
    query: str
    results: list[ToolResult]
    model_version: str
    latency_ms: float
    num_candidates_considered: int


@app.get("/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
def warm_retriever():
    """Load the embedding model once when the service starts."""
    from src.inference.recommend import _get_retriever

    _get_retriever()


@app.post("/recommend", response_model=RecommendResponse)
def recommend(request: RecommendRequest):
    """Recommend AI tools for a natural language query."""
    result = recommend_tools(
        query=request.query,
        top_k=request.top_k,
        use_reranker=request.use_reranker,
    )
    return result


@app.get("/recommend")
def recommend_get(
    query: str = Query(..., description="Natural language tool request"),
    top_k: int = Query(5, description="Number of tools to return"),
):
    """GET endpoint for quick queries."""
    result = recommend_tools(query=query, top_k=top_k, use_reranker=False)
    return result
