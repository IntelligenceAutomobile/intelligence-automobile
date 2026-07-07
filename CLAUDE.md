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

# Conventions de rédaction

## Tirets : jamais en parenthèse
Les tirets (cadratin `—`, demi-cadratin `–`) ne sont **pas** interdits. Ce qu'il ne faut **pas** faire : s'en servir de parenthèse (l'incise qui encadre une remarque au milieu d'une phrase). Ça fait « écrit par une IA ».
- Pour une incise : de vraies parenthèses, des virgules, ou deux phrases distinctes.
- Les autres usages (énumération, plage de valeurs, tirets déjà présents sur le site) restent acceptés.
- Vaut pour tout le contenu rédactionnel du site (textes i18n, descriptions, etc.).

# Conventions d'images

## Hero de page ↔ encart d'accueil : même image
Chaque page de service a un encart correspondant sur la page d'accueil (`src/app/page.tsx`, sections `SERVICE 0x`). **Quand on change l'image du hero d'une page, il faut mettre la même image dans l'encart d'accueil correspondant**, et inversement, pour garder la cohérence page ↔ accueil.
- Correspondances : `/vehicules` ↔ encart 01, `/recherche-personnalisee` ↔ 02, `/revente-sur-mesure` ↔ 03, `/transport-livraison` ↔ 04, `/methode` ↔ 05, `/services` ↔ 06.
- Le hero est plein cadre, l'encart est un 16:9 avec fondu vers le texte : vérifier que le cadrage tient dans les deux (capture desktop + mobile).

# Conventions d'affichage

## Format des nombres
Les nombres affichés (kilométrage, prix…) s'écrivent avec une **espace visible entre les groupes de milliers** : `150 000 km`, `15 490 €`.
- Utiliser `formatNumber()` de `src/lib/format.ts` — jamais `toLocaleString("fr-FR")` brut, qui produit une espace fine (U+202F) quasi invisible avec les polices du site.
