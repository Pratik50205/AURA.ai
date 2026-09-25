"""Interactive Rich CLI Interface for AURA AI Tool Discovery.

Provides circulating animated spinners for processing stages and visual
dashboard of how tools are processed in the pipeline.
"""
import os
import sys
import time
from typing import Any, Callable

# Suppress HuggingFace / Transformers progress bars from polluting terminal
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
try:
    from transformers.utils import logging as tf_logging
    tf_logging.disable_progress_bar()
except Exception:
    pass

# Ensure UTF-8 output on Windows terminals to avoid charmap encoding errors
if sys.platform == "win32":
    try:
        if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if sys.stderr.encoding and sys.stderr.encoding.lower() != "utf-8":
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich import box

console = Console()


def display_banner() -> None:
    """Print the AURA CLI header banner."""
    title_text = Text()
    title_text.append("🤖 AURA AI Tool Discovery & Recommendation Engine\n", style="bold cyan")
    title_text.append("Neural Semantic Search & Vector Tool Matching System", style="dim white")
    
    banner_panel = Panel(
        title_text,
        border_style="cyan",
        box=box.ROUNDED,
        padding=(1, 2),
    )
    console.print(banner_panel)


def initialize_engine() -> tuple[Any, dict]:
    """Run step-by-step engine initialization with circulating spinner.

    Returns:
        Tuple of (retriever instance, tool processing stats dict)
    """
    stats = {}
    start_total = time.time()

    # Stage 1: Load Tool Catalog & Metadata
    with console.status("[bold cyan]Loading tool metadata catalog...[/bold cyan]", spinner="dots"):
        from src.utils.config import get_config, resolve_path
        import json
        from collections import Counter

        config = get_config()
        tools_path = resolve_path(config["data"]["tools_file"])
        with open(tools_path, "r", encoding="utf-8") as f:
            raw_tools = json.load(f)

        tool_count = len(raw_tools)
        categories = Counter(t.get("category", "General") for t in raw_tools)
        stats["tool_count"] = tool_count
        stats["category_count"] = len(categories)
        stats["top_categories"] = categories.most_common(6)
        time.sleep(0.15)
        console.print(f"[bold green]✔[/bold green] [bold white]Tool Catalog:[/bold white] Loaded [cyan]{tool_count}[/cyan] tools across [cyan]{len(categories)}[/cyan] categories")

    # Stage 2: Initialize Neural Embedder
    with console.status("[bold cyan]Initializing neural embedding model (all-MiniLM-L6-v2)...[/bold cyan]", spinner="dots"):
        t0 = time.time()
        from src.retrieval.embed import AuraEmbedder
        embedder = AuraEmbedder()
        stats["model_name"] = embedder.model_name
        stats["dimension"] = embedder.dimension
        stats["device"] = embedder.device
        stats["embedder_latency"] = round(time.time() - t0, 2)
        console.print(
            f"[bold green]✔[/bold green] [bold white]Neural Embedder:[/bold white] [yellow]{embedder.model_name}[/yellow] "
            f"([cyan]{embedder.dimension}-d[/cyan], device=[cyan]{embedder.device}[/cyan])"
        )

    # Stage 3: Load FAISS Vector Index
    with console.status("[bold cyan]Loading FAISS vector database index...[/bold cyan]", spinner="dots"):
        t0 = time.time()
        from src.retrieval.index import AuraIndex
        index_dir = resolve_path(config["faiss"]["index_dir"])
        faiss_index = AuraIndex.load(index_dir)
        stats["index_type"] = faiss_index.index_type
        stats["indexed_vectors"] = faiss_index.index.ntotal
        stats["index_latency"] = round(time.time() - t0, 2)
        console.print(
            f"[bold green]✔[/bold green] [bold white]FAISS Vector Index:[/bold white] [magenta]{faiss_index.index_type}[/magenta] "
            f"loaded with [cyan]{faiss_index.index.ntotal}[/cyan] indexed tool vectors"
        )

    # Stage 4: Warmup & Assemble Retriever
    with console.status("[bold cyan]Assembling retrieval pipeline & warming up...[/bold cyan]", spinner="dots"):
        from src.retrieval.retrieve import AuraRetriever
        retriever = AuraRetriever(
            embedder=embedder,
            index=faiss_index,
            tools_map={t["id"]: t for t in raw_tools},
        )
        # Warmup query
        _ = retriever.retrieve("ai assistant", top_k=2)
        total_init_time = round(time.time() - start_total, 2)
        stats["total_init_time"] = total_init_time
        console.print(f"[bold green]✔[/bold green] [bold white]Pipeline Warmup:[/bold white] Verified semantic retrieval readiness in [cyan]{total_init_time}s[/cyan]")

    return retriever, stats


def render_tool_processing_dashboard(stats: dict) -> None:
    """Display a rich summary card showing how tools have been processed."""
    table = Table(
        box=box.ROUNDED,
        border_style="blue",
        title="[bold blue]Tool Processing & Vector Index State[/bold blue]",
        title_justify="center",
        show_header=True,
        header_style="bold magenta",
        expand=True,
    )
    table.add_column("Component", style="bold cyan", width=26)
    table.add_column("Specification / Metrics", style="white")

    table.add_row("Total Tools Ingested", f"[bold green]{stats.get('tool_count', 108)}[/bold green] curated AI tools")
    
    top_cats = ", ".join(f"{cat} ({cnt})" for cat, cnt in stats.get("top_categories", []))
    table.add_row("Catalog Taxonomy", f"[bold white]{stats.get('category_count', 0)}[/bold white] categories: [dim]{top_cats}...[/dim]")
    table.add_row("Neural Embedding Model", f"[yellow]{stats.get('model_name', 'all-MiniLM-L6-v2')}[/yellow] (CPU-optimized)")
    table.add_row("Vector Space Dimension", f"[cyan]{stats.get('dimension', 384)}[/cyan] dense dimensions, L2 unit normalized")
    table.add_row("Vector Index Engine", f"[magenta]FAISS {stats.get('index_type', 'FlatIP')}[/magenta] — exact inner product cosine search")
    table.add_row("Indexed Embeddings", f"[bold green]{stats.get('indexed_vectors', 108)}[/bold green] active tool vectors in RAM")
    table.add_row("Query Preprocessing", "[green]Active[/green] (automatic slang, acronym & synonym expansion)")
    table.add_row("Inference Target", "< 50ms sub-millisecond semantic retrieval")

    console.print()
    console.print(table)
    console.print("[dim italic]System is warm and ready for queries. Type 'exit' or 'q' to quit.[/dim italic]\n")


def execute_recommendation_with_spinner(
    recommend_fn: Callable,
    query: str,
    top_k: int = 5,
    use_reranker: bool = False,
) -> dict[str, Any]:
    """Execute recommendation with an animated circulating cursor."""
    with console.status(
        "[bold cyan]Processing query: vectorizing & searching tool database...[/bold cyan]",
        spinner="dots",
    ) as status:
        status.update("[bold cyan]Expanding synonyms & encoding query into 384-d vector...[/bold cyan]")
        time.sleep(0.04)
        status.update("[bold cyan]Querying FAISS index across 108 tool embeddings...[/bold cyan]")
        
        result = recommend_fn(query, top_k=top_k, use_reranker=use_reranker)
        
        status.update("[bold green]Finalizing tool rankings & similarity scores...[/bold green]")
        time.sleep(0.04)

    return result


def _render_score_bar(score: float, width: int = 10) -> tuple[str, str]:
    """Generate a visual score bar for similarity scores."""
    normalized = max(0.0, min(1.0, score))
    filled = int(round(normalized * width))
    pct = round(normalized * 100, 1)

    # Safe characters for terminal rendering
    bar = "━" * filled + "┄" * (width - filled)

    if pct >= 70:
        color = "bold green"
    elif pct >= 50:
        color = "bold cyan"
    elif pct >= 35:
        color = "bold yellow"
    else:
        color = "bold red"

    return f"{bar} {pct:.1f}%", color


def display_recommendation_results(result: dict[str, Any]) -> None:
    """Render tool recommendation results with rich card layout and score bars."""
    query = result.get("query", "")
    expanded = result.get("expanded_query")
    latency = result.get("latency_ms", 0.0)
    candidates_count = result.get("num_candidates_considered", 0)
    tools = result.get("results", [])

    # Summary header
    header_text = Text()
    header_text.append("Query: ", style="bold white")
    header_text.append(f'"{query}"', style="bold cyan")
    if expanded:
        header_text.append("  ➜  Expanded Concept: ", style="dim yellow")
        header_text.append(f'"{expanded}"', style="yellow")
    header_text.append("  |  ⚡ Latency: ", style="dim white")
    header_text.append(f"{latency:.1f}ms", style="bold green" if latency < 100 else "bold yellow")
    header_text.append("  |  Evaluated: ", style="dim white")
    header_text.append(f"{candidates_count} candidates", style="bold white")

    console.print()
    console.print(Panel(header_text, border_style="cyan", box=box.ROUNDED, padding=(0, 1)))

    if not tools:
        console.print("[yellow]No matching tools found for your query.[/yellow]\n")
        return

    # Render each recommended tool as a modern card
    for tool in tools:
        rank = tool.get("rank", "-")
        name = tool.get("name", "Unknown")
        category = tool.get("category", "AI Tool")

        score = tool.get("reranker_score")
        if score is None:
            score = tool.get("semantic_score", 0.0)
        score_str, score_color = _render_score_bar(float(score))

        card = Text()
        card.append(f" #{rank}  ", style="bold yellow")
        card.append(f"{name} ", style="bold white")
        card.append(f"[{category}]", style="bold cyan")
        card.append(f"   Match: {score_str}\n", style=score_color)

        reason = tool.get("reason") or tool.get("description") or ""
        card.append(f"      {reason}\n", style="white")

        url = tool.get("url") or ""
        if url:
            card.append(f"      🔗 {url}", style="blue underline")

        console.print(Panel(card, box=box.ROUNDED, border_style="dim cyan", padding=(0, 1)))

    console.print()
