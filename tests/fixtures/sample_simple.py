"""Sample simple module for FastAST unit tests."""

import os
import sys
from typing import List, Optional

def compute_sum(a: int, b: int) -> int:
    """Compute the sum of two integers."""
    result = a + b
    return result

def compute_product(x: int, y: int) -> int:
    """Compute the product of two integers."""
    total = x * y
    return total

class DataProcessor:
    """Processes batch items."""

    def __init__(self, name: str):
        self.name = name

    def process_items(self, items: List[str]) -> List[str]:
        output = []
        for item in items:
            output.append(item.strip().upper())
        return output

    def reset(self) -> None:
        self.name = "default"

