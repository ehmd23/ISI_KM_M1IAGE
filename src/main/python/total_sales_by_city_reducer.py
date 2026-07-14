#!/usr/bin/env python3
"""Reducer — CA total par ville (Hadoop Streaming).

Reçoit des lignes : ville<TAB>montant (triées par ville).
Émet : ville<TAB>somme
"""
import sys

current_city = None
current_total = 0.0

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    parts = line.split("\t")
    if len(parts) < 2:
        continue
    city, amount_str = parts[0], parts[1]
    try:
        amount = float(amount_str)
    except ValueError:
        continue

    if current_city == city:
        current_total += amount
    else:
        if current_city is not None:
            print(f"{current_city}\t{current_total}")
        current_city = city
        current_total = amount

if current_city is not None:
    print(f"{current_city}\t{current_total}")
