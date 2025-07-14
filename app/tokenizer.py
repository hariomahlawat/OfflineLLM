"""Token counting helper for dynamic retrieval heuristics."""

from __future__ import annotations

import re

_TOKEN_RE = re.compile(r"\w+|[^\s\w]", re.UNICODE)


def count_tokens(text: str) -> int:
    """Return an approximate token count."""
    return len(_TOKEN_RE.findall(text))
