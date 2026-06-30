# Certificat de cession — TransakAuto Bruxelles

Certificat de cession automobile **premium**, niveau concession (Porsche Approved / BMW
Premium Selection). A4 portrait, 2 pages, **formulaire PDF interactif** (40 champs),
100 % vectoriel. Noir · blanc · rose officiel TransakAuto `#ED008C` · police Montserrat.

## Utilisation rapide

Les PDF prêts à l'emploi sont dans **`out/`** :

- **`certificat-cession-transakauto-interactive.pdf`** — à remplir à l'écran (ordinateur).
- **`certificat-cession-transakauto-mobile.pdf`** — à remplir sur téléphone / tablette.
- **`certificat-cession-transakauto-print.pdf`** — à imprimer puis remplir au stylo.

## Régénérer après modification

1. Modifier le contenu dans **`certificat_data.py`** (textes, libellés, coordonnées).
2. Double-cliquer **`Régénérer le PDF.cmd`** (ou `python build_certificat.py`).

Les PDF de `out/` sont recréés automatiquement.

## Documentation

- `docs/documentation-technique.md` — architecture, style, régénération, compatibilité.
- `docs/nomenclature-champs.md` — les 40 champs et l'ordre de tabulation.

## Prérequis (développeur)

```
pip install reportlab pymupdf pypdf
```

---
*TransakAuto Bruxelles · Rue Léopold Ier 181 · 1020 Bruxelles · Belgique · +32 451 01 21 92 · bruxelles@transakauto.com*
