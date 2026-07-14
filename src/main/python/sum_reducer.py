#!/usr/bin/env python3
"""Reducer générique — somme des valeurs numériques par clé (Hadoop Streaming).

Reçoit des lignes : clé<TAB>valeur (triées par clé).
Émet : clé<TAB>somme

Réutilisable pour CA par ville / catégorie / paiement et comptage de transactions.
"""
import sys

current_key = None
current_total = 0.0

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    parts = line.split("\t")
    if len(parts) < 2:
        continue
    key, value_str = parts[0], parts[1]
    try:
        value = float(value_str)
    except ValueError:
        continue

    if current_key == key:
        current_total += value
    else:
        if current_key is not None:
            # Affiche un entier si la somme est entière (ex. comptages)
            if current_total == int(current_total):
                print(f"{current_key}\t{int(current_total)}")
            else:
                print(f"{current_key}\t{current_total}")
        current_key = key
        current_total = value

if current_key is not None:
    if current_total == int(current_total):
        print(f"{current_key}\t{int(current_total)}")
    else:
        print(f"{current_key}\t{current_total}")
