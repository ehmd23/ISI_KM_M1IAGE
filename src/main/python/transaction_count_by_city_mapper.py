#!/usr/bin/env python3
"""Mapper — nombre de transactions par ville (Hadoop Streaming).

Émet : ville<TAB>1
"""
import sys

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    fields = line.split("\t")
    if len(fields) >= 3:
        city = fields[2].strip()
        print(f"{city}\t1")
