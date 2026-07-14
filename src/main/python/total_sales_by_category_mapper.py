#!/usr/bin/env python3
"""Mapper — CA total par catégorie (Hadoop Streaming).

Émet : catégorie<TAB>montant
"""
import sys

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    fields = line.split("\t")
    if len(fields) >= 5:
        try:
            category = fields[3].strip()
            amount = float(fields[4].strip())
            print(f"{category}\t{amount}")
        except ValueError:
            continue
