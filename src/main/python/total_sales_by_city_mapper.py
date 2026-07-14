#!/usr/bin/env python3
"""Mapper — CA total par ville (Hadoop Streaming).

Format d'entrée (purchases.txt, séparateur tabulation) :
  date  heure  ville  catégorie  montant  moyen_de_paiement

Émet : ville<TAB>montant
"""
import sys

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    fields = line.split("\t")
    if len(fields) >= 5:
        try:
            city = fields[2].strip()
            amount = float(fields[4].strip())
            print(f"{city}\t{amount}")
        except ValueError:
            # Ligne mal formée : on ignore
            continue
