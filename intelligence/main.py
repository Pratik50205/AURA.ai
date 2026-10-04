"""Interactive CLI interface for AURA AI Tool Discovery & Recommendation.

Enhanced with animated circulating cursor (spinner) and rich visualization of
tool catalog ingestion, vector indexing, and neural semantic discovery.
"""
import sys
import logging

# Ensure UTF-8 output on Windows terminals
if sys.platform == "win32":
    try:
        if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if sys.stderr.encoding and sys.stderr.encoding.lower() != "utf-8":
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Suppress verbose library warnings during interactive CLI usage
logging.basicConfig(level=logging.WARNING)
logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
logging.getLogger("transformers").setLevel(logging.WARNING)

from pathlib import Path

# Ensure intelligence directory is in sys.path so 'src' imports resolve properly
_INTELLIGENCE_DIR = Path(__file__).resolve().parent
if str(_INTELLIGENCE_DIR) not in sys.path:
    sys.path.insert(0, str(_INTELLIGENCE_DIR))

from src.inference.recommend import recommend_tools
import src.inference.recommend as recommend_module
from src.inference.cli_ui import (
    console,
    display_banner,
    initialize_engine,
    render_tool_processing_dashboard,
    execute_recommendation_with_spinner,
    display_recommendation_results,
)


def main() -> None:
    """Run the interactive AURA recommendation CLI."""
    console.print()
    display_banner()
    console.print()

    # Step-by-step engine initialization with circulating cursor / spinner
    retriever, stats = initialize_engine()
    recommend_module._retriever = retriever

    # Render dashboard showing how tools have been processed into vector space
    render_tool_processing_dashboard(stats)

    # If single-query arguments provided via CLI (e.g. python main.py "presentation maker")
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        result = execute_recommendation_with_spinner(recommend_tools, query, top_k=5, use_reranker=False)
        display_recommendation_results(result)
        return

    # Interactive Query Loop
    while True:
        try:
            console.print("[bold cyan]Enter Query[/bold cyan] [dim](or 'q' to quit)[/dim]: ", end="")
            query = input().strip()
            if not query:
                continue
            if query.lower() in ("exit", "quit", "q"):
                console.print("\n[bold green]👋 Thank you for using AURA AI. Have a great day![/bold green]\n")
                break

            result = execute_recommendation_with_spinner(
                recommend_tools,
                query,
                top_k=5,
                use_reranker=False,
            )
            display_recommendation_results(result)
        except (KeyboardInterrupt, EOFError):
            console.print("\n\n[bold green]👋 Exiting. Have a great day![/bold green]\n")
            break


if __name__ == "__main__":
    main()
