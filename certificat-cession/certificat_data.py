# -*- coding: utf-8 -*-
"""
certificat_data.py — SOURCE MODIFIABLE du certificat de cession TransakAuto.

Tout le contenu éditable du document est ici : textes juridiques (verbatim),
libellés des champs, coordonnées de pied de page, identité visuelle et
nomenclature complète des champs interactifs.

Pour modifier le document sans toucher au moteur de rendu :
  - changer un libellé          -> dictionnaire FIELDS[...]['label']
  - changer un texte juridique  -> section TEXTES
  - changer une coordonnée      -> dictionnaire FOOTER
  - changer une couleur / police-> module build_certificat.py (section STYLE)

Les marqueurs ⟦nom_du_champ⟧ dans les phrases sont remplacés par un champ
interactif du même nom lors du rendu.
"""

# ───────────────────────────── IDENTITÉ DE MARQUE ─────────────────────────────
BRAND = {
    "name": "TransakAuto",
    "magenta": 0xED008C,        # rose officiel TransakAuto (globals.css du site)
    "magenta_dark": 0xC1006F,
    "black": 0x0D0C10,          # quasi-noir de marque
    "ink": 0x16151B,            # noir des textes
    "logo": "assets/transakauto-logo.png",
}

# ───────────────────────────── PIED DE PAGE ──────────────────────────────────
FOOTER = {
    "raison": "TransakAuto Bruxelles",
    "lignes": [
        "Rue Léopold Ier 181",
        "1020 Bruxelles",
        "Belgique",
    ],
    "tel": "+32 451 01 21 92",
    "email": "bruxelles@transakauto.com",
}

# ───────────────────────────── TEXTES (VERBATIM) ─────────────────────────────
# Repris à l'identique du certificat original ; seule la ponctuation a été mise
# aux normes typographiques françaises (guillemets « », espaces). Aucun mot,
# aucune mention ni clause supprimés.
TEXTES = {
    "eyebrow": "Certificat de cession",

    # PAGE 1 -----------------------------------------------------------------
    "titre_p1": "Vente d’un véhicule d’occasion",
    "partie_p1": "Partie 1 — Vente du véhicule",

    # Phrases du bloc PRIX (avec champs interactifs en ligne)
    "prix_phrase": (
        "Le prix de vente total et intégral est fixé à ⟦prix_chiffres⟧ € "
        "(⟦prix_lettres⟧) EUR (« Prix de vente »)."
    ),
    "iban_phrase": (
        "Le Prix de vente devra être intégralement payé avant la livraison du "
        "véhicule, par virement bancaire sur le compte du vendeur "
        "(IBAN du vendeur) : ⟦vendeur_iban⟧ les acheteur(s) étant tenus "
        "solidairement au paiement."
    ),
    "prix_reserve": (
        "Le véhicule demeure la propriété exclusive du vendeur jusqu’au paiement "
        "complet et effectif du Prix de vente sur le compte du vendeur mentionné "
        "ci-dessus. Le vendeur déclare être plein propriétaire du véhicule, libre "
        "de toute charge ou restriction quelconque."
    ),
    "prix_etat": (
        "Le véhicule est vendu et livré dans l’état où il se trouve, tel que connu "
        "et accepté par l’(les) acheteur(s) au moment de la conclusion du présent "
        "contrat."
    ),

    # PAGE 2 -----------------------------------------------------------------
    "titre_p2": "Livraison du véhicule et des documents",
    "partie_p2": (
        "Partie 2 — Après le paiement intégral du Prix de vente "
        "par l’(les) acheteur(s)"
    ),
    "doc_titre": "Documents et clés remis",
    "doc_soustitre": "à cocher",
    "ct_titre": "Contrôle technique",
    "ct_soustitre": "à cocher",
    "mentions_titre": "Mentions juridiques",

    "p2_inspection": (
        "L’(Les) acheteur(s) reconnaît(ssent) avoir inspecté le véhicule, le juger "
        "conforme et exempt de défauts, et avoir reçu l’ensemble des documents et "
        "clés y afférents mentionnés ci-dessus."
    ),
    "p2_responsabilite": (
        "Le vendeur est libéré de toute responsabilité, tant contractuelle "
        "qu’extracontractuelle, relative à la vente et à la livraison du véhicule, "
        "y compris en matière de vices apparents ou cachés, sauf s’il est prouvé "
        "que le vendeur avait connaissance d’un vice caché au moment de la "
        "signature du présent contrat."
    ),
    "p2_risques": (
        "À compter de la livraison, l’intégralité des risques est transférée à "
        "l’(aux) acheteur(s). Le vendeur confirme avoir reçu l’intégralité du "
        "Prix de vente."
    ),

    # Bloc signatures (communs aux deux pages)
    "sign_faita": "Fait à",
    "sign_le": "Le",
    "sign_exemplaires": "en deux exemplaires originaux",
    "sign_vendeur": "Signature du vendeur",
    "sign_acheteur": "Signature de(s) l’acheteur(s)",
}

# ───────────────────────────── NOMENCLATURE DES CHAMPS ───────────────────────
# Ordre = ordre de lecture = ordre de tabulation (TAB).
# type : text | checkbox | sign
FIELDS = {
    # --- VENDEUR (page 1) ---
    "v_nom":            {"label": "Nom",                 "type": "text",     "page": 1, "section": "Vendeur",   "desc": "Nom complet du vendeur"},
    "v_telephone":      {"label": "Téléphone",           "type": "text",     "page": 1, "section": "Vendeur",   "desc": "Téléphone du vendeur"},
    "v_mandataire":     {"label": "Mandataire",          "type": "text",     "page": 1, "section": "Vendeur",   "desc": "Mandataire éventuel"},
    "v_num_entreprise": {"label": "N° d’entreprise",     "type": "text",     "page": 1, "section": "Vendeur",   "desc": "Numéro d’entreprise (BCE)"},
    "v_siege_social":   {"label": "Siège social",        "type": "text",     "page": 1, "section": "Vendeur",   "desc": "Siège social / adresse du vendeur"},

    # --- ACHETEUR 1 (page 1) ---
    "a1_nom":               {"label": "Nom",                     "type": "text", "page": 1, "section": "Acheteur 1", "desc": "Nom complet de l’acheteur 1"},
    "a1_telephone":         {"label": "Téléphone",               "type": "text", "page": 1, "section": "Acheteur 1", "desc": "Téléphone de l’acheteur 1"},
    "a1_registre_national": {"label": "N° de registre national", "type": "text", "page": 1, "section": "Acheteur 1", "desc": "N° de registre national de l’acheteur 1"},
    "a1_adresse":           {"label": "Adresse",                 "type": "text", "page": 1, "section": "Acheteur 1", "desc": "Adresse de l’acheteur 1"},

    # --- ACHETEUR 2 (le cas échéant) (page 1) ---
    "a2_nom":               {"label": "Nom",                     "type": "text", "page": 1, "section": "Acheteur 2", "desc": "Nom complet de l’acheteur 2 (le cas échéant)"},
    "a2_telephone":         {"label": "Téléphone",               "type": "text", "page": 1, "section": "Acheteur 2", "desc": "Téléphone de l’acheteur 2"},
    "a2_registre_national": {"label": "N° de registre national", "type": "text", "page": 1, "section": "Acheteur 2", "desc": "N° de registre national de l’acheteur 2"},
    "a2_adresse":           {"label": "Adresse",                 "type": "text", "page": 1, "section": "Acheteur 2", "desc": "Adresse de l’acheteur 2"},

    # --- VÉHICULE (page 1) ---
    "veh_marque":       {"label": "Marque",                              "type": "text", "page": 1, "section": "Véhicule", "desc": "Marque du véhicule"},
    "veh_modele":       {"label": "Modèle",                              "type": "text", "page": 1, "section": "Véhicule", "desc": "Modèle du véhicule"},
    "veh_date_mec":     {"label": "Date de première mise en circulation", "type": "text", "page": 1, "section": "Véhicule", "desc": "Date de première mise en circulation"},
    "veh_couleur":      {"label": "Couleur",                             "type": "text", "page": 1, "section": "Véhicule", "desc": "Couleur du véhicule"},
    "veh_puissance_kw": {"label": "Puissance moteur (kW)",               "type": "text", "page": 1, "section": "Véhicule", "desc": "Puissance moteur en kW"},
    "veh_cylindree_cc": {"label": "Cylindrée (CC)",                      "type": "text", "page": 1, "section": "Véhicule", "desc": "Cylindrée en cm³"},
    "veh_kilometrage":  {"label": "Kilométrage au moment de la vente (km)", "type": "text", "page": 1, "section": "Véhicule", "desc": "Kilométrage au moment de la vente"},
    "veh_chassis":      {"label": "N° de châssis (VIN)",                 "type": "text", "page": 1, "section": "Véhicule", "desc": "Numéro de châssis / VIN (17 caractères)", "maxlen": 17},

    # --- PRIX DE VENTE (page 1, champs en ligne dans les phrases) ---
    "prix_chiffres": {"label": "Prix (chiffres)",        "type": "text", "page": 1, "section": "Prix de vente", "desc": "Montant en chiffres (€)"},
    "prix_lettres":  {"label": "Prix (toutes lettres)",  "type": "text", "page": 1, "section": "Prix de vente", "desc": "Montant en toutes lettres"},
    "vendeur_iban":  {"label": "IBAN du vendeur",        "type": "text", "page": 1, "section": "Prix de vente", "desc": "IBAN du compte du vendeur"},

    # --- SIGNATURES PAGE 1 ---
    "p1_fait_a":        {"label": "Fait à",  "type": "text", "page": 1, "section": "Signatures", "desc": "Lieu de signature (page 1)"},
    "p1_date":          {"label": "Le",      "type": "text", "page": 1, "section": "Signatures", "desc": "Date de signature (page 1)"},
    "p1_sign_vendeur":  {"label": "Signature du vendeur",        "type": "sign", "page": 1, "section": "Signatures", "desc": "Signature du vendeur (page 1)"},
    "p1_sign_acheteur": {"label": "Signature de(s) l’acheteur(s)", "type": "sign", "page": 1, "section": "Signatures", "desc": "Signature acheteur(s) (page 1)"},

    # --- DOCUMENTS ET CLÉS REMIS (page 2) ---
    "doc_conformite":     {"label": "Certificat de conformité",                "type": "checkbox", "page": 2, "section": "Documents remis", "desc": "Certificat de conformité remis"},
    "doc_historique":     {"label": "Historique d’entretien",                  "type": "checkbox", "page": 2, "section": "Documents remis", "desc": "Historique d’entretien remis"},
    "doc_immatriculation":{"label": "Certificat d’immatriculation (deux volets)","type": "checkbox","page": 2, "section": "Documents remis", "desc": "Certificat d’immatriculation (2 volets) remis"},
    "doc_cles":           {"label": "Clés (2 exemplaires)",                    "type": "checkbox", "page": 2, "section": "Documents remis", "desc": "Clés (2 exemplaires) remises"},

    # --- CONTRÔLE TECHNIQUE (page 2) ---
    "ct_certificat_valide": {"label": "Certificat de contrôle technique valide (moins de 2 mois)", "type": "checkbox", "page": 2, "section": "Contrôle technique", "desc": "Certificat de CT valide (< 2 mois)"},
    "ct_demande_immat":     {"label": "Demande d’immatriculation de véhicule d’occasion",          "type": "checkbox", "page": 2, "section": "Contrôle technique", "desc": "Demande d’immatriculation véhicule d’occasion"},
    "ct_rapport":           {"label": "Rapport de contrôle technique",                             "type": "checkbox", "page": 2, "section": "Contrôle technique", "desc": "Rapport de contrôle technique"},
    "ct_carpass":           {"label": "Car-Pass",                                                  "type": "checkbox", "page": 2, "section": "Contrôle technique", "desc": "Car-Pass remis"},

    # --- SIGNATURES PAGE 2 ---
    "p2_fait_a":        {"label": "Fait à",  "type": "text", "page": 2, "section": "Signatures", "desc": "Lieu de signature (page 2)"},
    "p2_date":          {"label": "Le",      "type": "text", "page": 2, "section": "Signatures", "desc": "Date de signature (page 2)"},
    "p2_sign_vendeur":  {"label": "Signature du vendeur",        "type": "sign", "page": 2, "section": "Signatures", "desc": "Signature du vendeur (page 2)"},
    "p2_sign_acheteur": {"label": "Signature de(s) l’acheteur(s)", "type": "sign", "page": 2, "section": "Signatures", "desc": "Signature acheteur(s) (page 2)"},
}
