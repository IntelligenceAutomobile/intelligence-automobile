# Documentation technique — Certificat de cession TransakAuto

Document contractuel premium **A4 portrait, 2 pages, 100 % vectoriel**, formulaire
PDF interactif (AcroForm), généré par script Python (ReportLab). Conçu pour usage
quotidien en concession : remplissable à l'écran, sur mobile, ou imprimé puis rempli
à la main.

---

## 1. Arborescence

```
certificat-cession/
├── build_certificat.py          # générateur (moteur de rendu + AcroForm)
├── certificat_data.py           # SOURCE MODIFIABLE : textes, libellés, nomenclature, marque
├── Régénérer le PDF.cmd         # double-clic Windows → régénère tous les PDF
├── fonts/                       # Montserrat (Light/Regular/Medium/SemiBold/Bold), embarquée
├── assets/
│   └── transakauto-logo.png     # logo officiel (en-tête uniquement)
├── docs/
│   ├── documentation-technique.md   # ce fichier
│   └── nomenclature-champs.md       # liste des 40 champs (= ordre TAB)
└── out/                         # livrables générés
    ├── certificat-cession-transakauto-interactive.pdf   # PDF interactif (AcroForm)
    ├── certificat-cession-transakauto-mobile.pdf        # idem, validé mobile
    ├── certificat-cession-transakauto-print.pdf         # version impression (à remplir à la main)
    └── *.png                                            # aperçus de contrôle
```

## 2. Livrables

| Fichier | Usage |
|---|---|
| `…-interactive.pdf` | Remplissage à l'écran (Acrobat, Edge, Chrome, Preview…), navigation `TAB`, cases cliquables. |
| `…-mobile.pdf` | Même fichier, validé sur lecteurs iOS / Android (PDF vectoriel, widgets AcroForm standard). |
| `…-print.pdf` | Sans champs interactifs : champs blancs cerclés, prêts à être remplis au stylo. Économe en encre. |
| `certificat_data.py` + `build_certificat.py` | **Fichier source modifiable** + script de régénération. |
| `docs/` | Documentation technique + nomenclature des champs. |

## 3. Identité visuelle

| Élément | Valeur |
|---|---|
| Rose officiel | `#ED008C` (foncé `#C1006F`) — source : `globals.css` du site TransakAuto |
| Noir | `#0D0C10` (bandeau) · `#16151B` (texte) |
| Champs | gris très clair `#F3F3F5`, filet `#E2E2E8`, coins arrondis |
| Panneau prix | rose très clair `#FCEAF3` |
| Typographie | **Montserrat** (titres SemiBold, libellés Medium, corps Regular/Light), embarquée et sous-ensemble Latin complet (accents, €, « », apostrophes typographiques) |
| Saisie des champs | Helvetica (police PDF de base → rendu garanti sur tous les lecteurs) |
| En-tête | bandeau noir + logo + filet rose. Pas de filigrane. Logo uniquement en en-tête. |

## 4. Architecture du générateur

- **Coordonnées en millimètres, origine en haut** (helpers `_y`, `round_box`, `text`, `para`).
- **Mise en page « flux »** : un curseur vertical descend ; chaque section retourne sa position basse.
- **`flow_fields`** : texte avec champs interactifs *en ligne* (marqueurs `⟦nom⟧`) — utilisé pour la phrase de prix et la phrase IBAN, afin de conserver le texte juridique exact.
- **Panneaux** (prix, mentions) : rendus en deux passes — une passe « mesure » (`dry=True`) calcule la hauteur, puis le fond est peint **avant** le texte.
- **Justification** via `setWordSpace` ; **interlettrage** des titres via `setCharSpace`.
  ⚠️ Ces deux paramètres sont réinitialisés explicitement à chaque tracé (sinon fuite d'état texte PDF).

### Champs AcroForm
- Texte : `acroForm.textfield` borderless transparent posé sur un cadre dessiné (design maîtrisé).
- Cases : `acroForm.checkbox`, `buttonStyle="check"`, coche `#ED008C`.
- Signatures : champ texte large (remplissable au clavier **ou** signé à la main après impression).
- **Post-traitement pypdf** : `NeedAppearances=true` (rendu de la saisie homogène entre lecteurs) + `/Tabs /R` (ordre de tabulation par ligne) sur chaque page.

## 5. Régénérer / modifier

```bash
# Tous les PDF + aperçus PNG
python build_certificat.py

# PDF seulement (sans PNG)
python build_certificat.py --no-png

# Afficher la nomenclature des champs
python build_certificat.py --nomenclature

# Debug mise en page (vérifie le non-débordement page 1)
CERT_DEBUG=1 python build_certificat.py     # (Windows: set CERT_DEBUG=1 && python …)
```

**Modifier un texte / libellé / coordonnée** → éditer `certificat_data.py` uniquement, puis régénérer.
**Modifier le style (couleurs, polices, espacements)** → section *PALETTE* / *GÉOMÉTRIE* en tête de `build_certificat.py`.

## 6. Dépendances

```
pip install reportlab pymupdf pypdf
```
- `reportlab` — génération PDF vectorielle + AcroForm.
- `pymupdf` — rendu PNG des aperçus (QA) ; non requis avec `--no-png`.
- `pypdf` — post-traitement (NeedAppearances, ordre TAB).
- Polices Montserrat (OFL) dans `fonts/`.

## 7. Compatibilité vérifiée

PDF 100 % vectoriel (hors logo bitmap haute résolution en en-tête). Polices Montserrat
embarquées ; saisie en Helvetica (base 14). Lisible et remplissable sous Windows, macOS,
iOS, Android, Acrobat, Edge, Chrome, Safari. Impression professionnelle (aucune couleur
hors noir / blanc / rose `#ED008C` et ses dérivés clairs).

## 8. Conformité au certificat original

Tous les champs, mentions, cases à cocher et clauses juridiques des 2 pages d'origine
sont repris **sans omission**. Seules adaptations : mise aux normes typographiques
françaises (guillemets « », apostrophes courbes) et précision « N° de châssis (VIN) ».
Voir `nomenclature-champs.md` pour le détail.
