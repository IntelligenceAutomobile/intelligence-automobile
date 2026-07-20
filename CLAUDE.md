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

## Expliquer simplement
Les explications s'adressent à quelqu'un qui connaît son site, pas le code. **Parler du site tel qu'il se voit à l'écran, jamais en termes techniques.**
- Commencer par **où** ça se passe et **ce que ça donne à l'écran** : quelle page, quel endroit, ce qui est moche ou cassé. Une capture vaut mieux qu'un paragraphe.
- Les noms de propriétés CSS, de composants, de classes Tailwind restent dans le code. Dire « le titre est trop large pour l'écran », pas « `flex-shrink-0` empêche le `<p>` de se réduire ».
- Les chiffres servent quand ils parlent : « ça dépasse de 25 px » se comprend, « `scrollWidth` 415 vs `innerWidth` 390 » non.
- Une phrase par idée. Éviter les paragraphes qui enchaînent trois causes.
- Le détail technique se donne s'il est demandé, ou en une ligne à la fin pour ceux qui veulent creuser.

# Conventions de rédaction

## Tirets : jamais en parenthèse
Les tirets (cadratin `—`, demi-cadratin `–`) ne sont **pas** interdits. Ce qu'il ne faut **pas** faire : s'en servir de parenthèse (l'incise qui encadre une remarque au milieu d'une phrase). Ça fait « écrit par une IA ».
- Pour une incise : de vraies parenthèses, des virgules, ou deux phrases distinctes.
- Les autres usages (énumération, plage de valeurs, tirets déjà présents sur le site) restent acceptés.
- Vaut pour tout le contenu rédactionnel du site (textes i18n, descriptions, etc.).

## Pas de négation
Les phrases s'écrivent à la forme affirmative. Éviter "ne...pas", "aucun", "jamais", "zéro", "sans" et autres tournures négatives, même quand elles semblent percutantes.
- Décrire ce qui est fait/proposé, pas ce qui est absent ou évité.
- Exemple : pas "Vous ne parlez à aucun acheteur" → "Nous sommes votre unique interlocuteur".
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
