#!/usr/bin/env python3
"""Mapper — CA total par moyen de paiement (Hadoop Streaming).

Émet : moyen_de_paiement<TAB>montant
"""
import sys

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    fields = line.split("\t")
    if len(fields) >= 6:
        try:
            payment = fields[5].strip()
            amount = float(fields[4].strip())
            print(f"{payment}\t{amount}")
        except ValueError:
            continue
