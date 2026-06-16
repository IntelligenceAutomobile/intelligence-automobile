@AGENTS.md

# Règles de collaboration

## Validation avant action
Avant toute modification de code, **toujours proposer la solution** et attendre une validation explicite.
- Décrire ce qui va changer et pourquoi
- Ne passer à l'implémentation qu'après un "oui", "ok", "vas-y" ou équivalent
- S'applique à toutes les modifications : UI, logique, base de données, config

## Commit et déploiement
**Ne jamais faire de commit ni de deploy sans autorisation explicite.**
- Attendre que l'utilisateur demande explicitement ("commit", "deploy", "pousse", etc.)
- Ne pas commit ni pousser automatiquement après une modification, même si le travail est terminé

# Conventions d'affichage

## Format des nombres
Les nombres affichés (kilométrage, prix…) s'écrivent avec une **espace visible entre les groupes de milliers** : `150 000 km`, `15 490 €`.
- Utiliser `formatNumber()` de `src/lib/format.ts` — jamais `toLocaleString("fr-FR")` brut, qui produit une espace fine (U+202F) quasi invisible avec les polices du site.
