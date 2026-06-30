# Nomenclature des champs — Certificat de cession TransakAuto

**40 champs interactifs** · l'ordre ci-dessous est l'**ordre de tabulation** (touche `TAB`).
Types : `text` (champ de saisie) · `sign` (zone de signature remplissable) · `checkbox` (case à cocher, coche rose `#ED008C`).

## Page 1 — Vente du véhicule

| # | Nom technique | Type | Section | Libellé |
|---|---|---|---|---|
| 1 | `v_nom` | text | Vendeur | Nom |
| 2 | `v_telephone` | text | Vendeur | Téléphone |
| 3 | `v_mandataire` | text | Vendeur | Mandataire |
| 4 | `v_num_entreprise` | text | Vendeur | N° d'entreprise |
| 5 | `v_siege_social` | text | Vendeur | Siège social |
| 6 | `a1_nom` | text | Acheteur 1 | Nom |
| 7 | `a1_telephone` | text | Acheteur 1 | Téléphone |
| 8 | `a1_registre_national` | text | Acheteur 1 | N° de registre national |
| 9 | `a1_adresse` | text | Acheteur 1 | Adresse |
| 10 | `a2_nom` | text | Acheteur 2 (le cas échéant) | Nom |
| 11 | `a2_telephone` | text | Acheteur 2 (le cas échéant) | Téléphone |
| 12 | `a2_registre_national` | text | Acheteur 2 (le cas échéant) | N° de registre national |
| 13 | `a2_adresse` | text | Acheteur 2 (le cas échéant) | Adresse |
| 14 | `veh_marque` | text | Véhicule | Marque |
| 15 | `veh_modele` | text | Véhicule | Modèle |
| 16 | `veh_date_mec` | text | Véhicule | Date de première mise en circulation |
| 17 | `veh_couleur` | text | Véhicule | Couleur |
| 18 | `veh_puissance_kw` | text | Véhicule | Puissance moteur (kW) |
| 19 | `veh_cylindree_cc` | text | Véhicule | Cylindrée (CC) |
| 20 | `veh_kilometrage` | text | Véhicule | Kilométrage au moment de la vente (km) |
| 21 | `veh_chassis` | text | Véhicule | N° de châssis (VIN) — `maxlen 17` |
| 22 | `prix_chiffres` | text | Prix de vente | Prix (chiffres) |
| 23 | `prix_lettres` | text | Prix de vente | Prix (toutes lettres) |
| 24 | `vendeur_iban` | text | Prix de vente | IBAN du vendeur |
| 25 | `p1_fait_a` | text | Signatures | Fait à |
| 26 | `p1_date` | text | Signatures | Le (date) |
| 27 | `p1_sign_vendeur` | sign | Signatures | Signature du vendeur |
| 28 | `p1_sign_acheteur` | sign | Signatures | Signature de(s) l'acheteur(s) |

## Page 2 — Livraison du véhicule et des documents

| # | Nom technique | Type | Section | Libellé |
|---|---|---|---|---|
| 29 | `doc_conformite` | checkbox | Documents remis | Certificat de conformité |
| 30 | `doc_historique` | checkbox | Documents remis | Historique d'entretien |
| 31 | `doc_immatriculation` | checkbox | Documents remis | Certificat d'immatriculation (deux volets) |
| 32 | `doc_cles` | checkbox | Documents remis | Clés (2 exemplaires) |
| 33 | `ct_certificat_valide` | checkbox | Contrôle technique | Certificat de contrôle technique valide (moins de 2 mois) |
| 34 | `ct_demande_immat` | checkbox | Contrôle technique | Demande d'immatriculation de véhicule d'occasion |
| 35 | `ct_rapport` | checkbox | Contrôle technique | Rapport de contrôle technique |
| 36 | `ct_carpass` | checkbox | Contrôle technique | Car-Pass |
| 37 | `p2_fait_a` | text | Signatures | Fait à |
| 38 | `p2_date` | text | Signatures | Le (date) |
| 39 | `p2_sign_vendeur` | sign | Signatures | Signature du vendeur |
| 40 | `p2_sign_acheteur` | sign | Signatures | Signature de(s) l'acheteur(s) |

---

**Récapitulatif** : 28 champs page 1 + 12 champs page 2 = **40 champs**
(32 `text` dont 4 zones de signature · 8 `checkbox`).

> Cette table est générée depuis la source unique `certificat_data.py`.
> Pour la régénérer : `python build_certificat.py --nomenclature`.
