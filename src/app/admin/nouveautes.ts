// Nouveautés par module : ce qui a changé, écrit pour être lu par quelqu'un qui
// connaît son métier plutôt que le code. Le « i » de la barre de navigation
// ouvre la fiche du module concerné.
//
// Un module gagne son « i » dès qu'il a une entrée ici. Pour en ajouter un :
// une entrée avec le lien du module, la date de la reprise, une phrase de
// résumé, puis des groupes de points courts.

export type Nouveaute = {
  /** Lien du module dans la barre de navigation. */
  href: string;
  titre: string;
  /** Date de la dernière reprise, telle qu'affichée. */
  date: string;
  /** Une phrase : ce que le module fait de mieux qu'avant. */
  resume: string;
  groupes: { titre: string; points: string[] }[];
};

export const NOUVEAUTES: Nouveaute[] = [
  {
    href: "/admin/mandats",
    titre: "Mandats",
    date: "20 août 2026",
    resume:
      "Le contrat de la revente sur mesure se remplit à l'écran et s'imprime en 16 articles, prêt à signer avec le vendeur.",
    groupes: [
      {
        titre: "Le contrat se prépare ici",
        points: [
          "La fiche suit le document : le mandant, le véhicule et ses déclarations, le prix plancher, les honoraires.",
          "Deux formules de rémunération au choix : frais à la charge de l'acquéreur, ou commission de 5 % au vendeur, entre 890 € et 2 990 €.",
          "Chaque mandat reçoit son numéro : MV-2026-001, remis à 1 chaque année.",
          "La création retrouve la fiche client existante et ouvre l'affaire dans le pipeline, comme les reprises.",
        ],
      },
      {
        titre: "Le document fait foi",
        points: [
          "Quatre pages A4 à la charte, avec les cases cochées selon la fiche : formule, garde du véhicule, exécution immédiate.",
          "Le bordereau de rétractation détachable ferme le document, le médiateur est nommé, l'article 14 s'adapte au lieu de signature.",
          "Le mandat signé se scanne et se verse au dossier, chaque pièce laisse une trace au journal.",
        ],
      },
      {
        titre: "Trois missions, trois contrats",
        points: [
          "Le mandat de recherche (MR-) contractualise la recherche personnalisée : cahier des charges, budget, honoraires dus uniquement au succès (990 à 1 990 € selon le budget).",
          "Le mandat d'import (MI-) sécurise une acquisition en Europe : forfait fixe de 1 490 à 2 490 €, quitus et carte grise inclus, transport à prix coûtant, paiement direct au vendeur étranger.",
          "Le forfait d'import vaut aussi quand le client colle son annonce, comme le propose le site.",
          "Un mandat d'import signé ouvre son dossier d'immatriculation en un clic, prérempli, suivi depuis le module Immatriculations.",
        ],
      },
      {
        titre: "La signature se fait en ligne",
        points: [
          "« Envoyer pour signature » adresse au vendeur un lien où il lit les quatre pages telles qu'elles s'impriment.",
          "Il tape son nom, valide la mention « Lu et approuvé, bon pour mandat » et choisit lui-même l'exécution immédiate.",
          "Nom, date et adresse de connexion s'enregistrent, le cachet s'appose sur la dernière page du document.",
          "Vous voyez s'il a ouvert le lien, une fenêtre annonce la signature où que vous soyez, et une pastille s'allume sur « Mandats ».",
        ],
      },
      {
        titre: "La mission se suit",
        points: [
          "Les échéances se surveillent depuis la liste : un mandat qui expire sous 10 jours s'allume pour proposer le renouvellement écrit.",
          "À la signature, la fiche véhicule passe en régime « Mandat client » et la mention légale suit sur les annonces.",
          "L'issue se pose sur la fiche : vendu avec son prix, retiré, échu ou rétracté, tout reste archivé.",
        ],
      },
    ],
  },
  {
    href: "/admin/devis",
    titre: "Devis",
    date: "30 juillet 2026",
    resume:
      "Avant, c'était un éditeur de devis. Maintenant, c'est un outil de vente : on envoie, on suit, le client signe, et on facture.",
    groupes: [
      {
        titre: "Le devis part au client",
        points: [
          "L'envoi se fait depuis l'écran, avec un aperçu de l'email avant qu'il parte.",
          "Le client ouvre son devis sur une page à lui et signe en un clic, sans imprimer ni scanner.",
          "Vous voyez s'il a ouvert le lien, et combien de fois.",
          "Une fenêtre vous prévient dès qu'un devis est accepté, où que vous soyez dans l'outil, et une pastille s'allume sur « Devis ».",
        ],
      },
      {
        titre: "La saisie va plus vite",
        points: [
          "Les lignes sont dans un tableau : Entrée passe à la suivante, et l'ordre se change à la souris.",
          "La voiture se prend directement dans le stock, avec son prix.",
          "Une barre en bas suit le total, l'acompte, le solde et votre marge pendant que vous tapez.",
          "Le brouillon survit à une fermeture d'onglet.",
          "Un aperçu du document se met à jour en direct à côté de la saisie.",
        ],
      },
      {
        titre: "On retrouve tout",
        points: [
          "Recherche à la touche « / », filtres par état, colonnes triables.",
          "Le statut se change depuis la liste, avec un « annuler » si vous vous trompez.",
          "Un devis se duplique pour repartir d'une base au lieu de tout resaisir.",
          "Ctrl+K retrouve n'importe quel document en trois lettres.",
        ],
      },
      {
        titre: "Le document fait sérieux",
        points: [
          "Le prix domine la page, le pied de page porte votre identité et votre IBAN.",
          "Un encart « Véhicule concerné » : photo, numéro de série, immatriculation, première mise en circulation.",
          "Votre identité d'entreprise vient des réglages, au lieu d'être retapée sur chaque devis.",
          "Un bouton passe le document, l'email et la page de signature en anglais.",
        ],
      },
      {
        titre: "Vendre hors de France",
        points: [
          "Un régime « livraison intracommunautaire » vend à un professionnel étranger sans TVA française.",
          "La phrase légale qui le justifie s'imprime sur le document.",
          "Le numéro de TVA du client se vérifie d'un clic auprès du registre européen.",
          "Sur une voiture récente, l'écran prévient que le régime de la marge ne s'applique pas.",
        ],
      },
      {
        titre: "Moins d'erreurs",
        points: [
          "Un devis sans client ni ligne s'enregistre, mais ne peut plus partir.",
          "L'écart d'un centime entre l'acompte et le solde a disparu.",
          "Un devis accepté se fige, pour rester fidèle à ce que le client a signé.",
          "Une reprise se saisit en montant négatif et se déduit du total.",
        ],
      },
    ],
  },
  {
    href: "/admin/factures",
    titre: "Factures",
    date: "30 juillet 2026",
    resume:
      "Une facture émise ne se modifie ni ne se supprime : elle se corrige par un avoir. C'est maintenant possible, et l'encours dit enfin la vérité.",
    groupes: [
      {
        titre: "L'avoir",
        points: [
          "Un bouton sur la fiche facture : avoir total pour annuler, ou partiel pour créditer un montant.",
          "Un motif au choix, imprimé sur le document remis au client.",
          "Les avoirs ont leur propre numérotation continue, séparée des factures.",
          "Deux avoirs ne peuvent jamais dépasser le montant de la facture.",
        ],
      },
      {
        titre: "L'encours est juste",
        points: [
          "Une facture annulée par un avoir sort de l'encours impayé.",
          "Une facture partiellement créditée affiche ce qui reste réellement à encaisser.",
          "Les relances s'arrêtent sur une facture annulée, au lieu de réclamer un montant qui ne rentrera jamais.",
          "La liste montre les avoirs à côté des factures, avec le numéro de la facture corrigée.",
        ],
      },
    ],
  },
  {
    href: "/admin/clients",
    titre: "Clients & leads",
    date: "31 juillet 2026",
    resume:
      "Avant, la page montrait vos dossiers. Maintenant elle vous dit quoi faire en arrivant le matin, et elle vous rappelle ceux que vous alliez oublier.",
    groupes: [
      {
        titre: "La journée commence ici",
        points: [
          "Un bandeau « À faire aujourd'hui » ouvre la page, le plus en retard en tête.",
          "Il réunit quatre files : vos rappels échus, les demandes du site sans réponse, les affaires qui gèlent, et les devis sans nouvelles.",
          "« Fait » efface le rappel et l'inscrit au journal de l'affaire. « Reporter » le repousse à demain, dans trois jours ou dans une semaine.",
          "Quand tout est traité, le bandeau se replie en une ligne.",
        ],
      },
      {
        titre: "Rien ne s'oublie",
        points: [
          "Chaque affaire porte une prochaine action datée, en orange le jour venu, en rouge quand c'est passé.",
          "Une affaire qui gèle porte un liseré, avec un délai propre à son étape : deux jours sur une demande fraîche, dix après une proposition envoyée.",
          "Perdre une affaire demande pourquoi, en un clic parmi six motifs. Dans un an, ça dira sur quoi vous perdez.",
          "Le carnet se classe sur l'activité réelle : noter un appel fait remonter le client en tête.",
        ],
      },
      {
        titre: "Le pipeline se lit d'un coup d'œil",
        points: [
          "Trois chiffres en tête : l'argent en cours, les affaires à relancer, le gagné sur trente jours.",
          "Les affaires gagnées ou perdues rejoignent « Conclues », avec un bouton pour les remettre au pipeline.",
          "Les cartes bougent dès le clic, et reviennent en place si l'enregistrement échoue.",
          "Une seule recherche filtre tout l'écran, sans se soucier des accents ni de l'ordre des mots.",
        ],
      },
      {
        titre: "La fiche client",
        points: [
          "L'objet, le budget, l'origine et le véhicule d'une affaire se corrigent, et l'affaire se supprime.",
          "L'email et le téléphone se cliquent pour écrire ou appeler, avec un bouton de copie à côté.",
          "Un compte rendu d'appel tient sur plusieurs lignes, et se pose juste sous le champ de saisie.",
          "Un devis créé depuis la fiche se rattache à l'affaire qu'il fait avancer.",
        ],
      },
      {
        titre: "Moins de doublons, moins de faux pas",
        points: [
          "Le même prospect cesse de se dédoubler : l'email et le téléphone se rapprochent quelle que soit leur écriture.",
          "La création manuelle prévient quand une fiche proche existe déjà, et propose de l'ouvrir.",
          "Un budget illisible est refusé avec un message, au lieu d'être enregistré de travers.",
          "La fenêtre de création se ferme avec Échap et garde votre saisie sur un clic à côté.",
        ],
      },
      {
        titre: "Données personnelles",
        points: [
          "« Copie de ses données » produit un fichier avec tout : fiche, affaires, échanges, devis, factures, rendez-vous, garanties, immatriculations. Le délai légal de réponse est d'un mois.",
          "L'effacement annonce à l'avance ce qui part et ce qui reste : les factures et avoirs sont gardés dix ans avec le nom et l'adresse, comme la loi l'impose, sans email ni téléphone.",
          "Une trace de la demande reste sur la fiche : c'est votre registre. Sur une fiche effacée, plus aucune action ne peut réinscrire les données.",
          "Les actions destructrices s'affichent uniquement aux comptes qui en ont le droit.",
        ],
      },
    ],
  },
  {
    href: "/admin/relances",
    titre: "Relances",
    date: "30 juillet 2026",
    resume:
      "Avant, on cliquait et on espérait. Maintenant, on relit avant d'envoyer, on sait ce qui est parti, et l'outil dit quoi traiter en premier.",
    groupes: [
      {
        titre: "C'est fiable",
        points: [
          "Un email qui échoue reste marqué à faire, au lieu d'être compté comme envoyé.",
          "Les rappels de facture partent à la date d'échéance écrite sur la facture.",
          "Le nombre de jours affiché part de la date d'envoi réelle du devis.",
          "Un devis accepté ou une facture réglée entre-temps arrête l'envoi automatiquement.",
        ],
      },
      {
        titre: "Vous gardez la main",
        points: [
          "Avant chaque envoi, une fenêtre montre l'email exact que le client va recevoir, avec son adresse.",
          "Un mot personnel s'ajoute au message, visible dans l'aperçu.",
          "Le message part au clic sur « Envoyer la relance », jamais avant.",
        ],
      },
      {
        titre: "Vous voyez tout",
        points: [
          "Un historique en bas de page : chaque relance, appel, report et échec, avec la date et l'heure.",
          "Un compteur dans le menu et un bandeau sur le tableau de bord signalent ce qui attend.",
          "La fiche d'un devis rappelle ses relances : « Relancé ×2 le 21/07 ».",
        ],
      },
      {
        titre: "Ça va plus vite",
        points: [
          "Les plus urgents en tête, et les gros retards passent au rouge.",
          "Le montant total en attente s'affiche en haut de page.",
          "« Reporter » propose 1 semaine, 1 mois, noter un appel, ou arrêter les relances. Tout s'annule.",
          "Une ligne sans email propose un lien direct pour l'ajouter.",
        ],
      },
      {
        titre: "Les emails clients sont meilleurs",
        points: [
          "Le lien vers le devis est dans le message : le client consulte et accepte en un clic.",
          "Les rappels de facture montent en fermeté au fil des relances.",
          "Un devis dont la validité est passée propose une version à jour.",
        ],
      },
      {
        titre: "Et sur téléphone",
        points: [
          "Le client, le montant et les boutons sont lisibles et utilisables.",
          "La page se replie proprement, sans chevauchement.",
        ],
      },
    ],
  },
  {
    href: "/admin/emails",
    titre: "Emails",
    date: "30 juillet 2026",
    resume:
      "Un écran unique pour savoir quels messages sont partis du site, et pour suspendre un destinataire quand il le faut.",
    groupes: [
      {
        titre: "Le journal des envois",
        points: [
          "Chaque email du site s'inscrit ici : destinataire, objet, heure et provenance.",
          "Trois issues possibles, affichées clairement : envoyé, retenu, refusé, avec le motif.",
          "Un filtre pour ne voir que les envois retenus ou refusés.",
        ],
      },
      {
        titre: "La liste rouge",
        points: [
          "Une adresse ou un domaine entier se bloque en deux clics : plus aucun message ne part vers lui.",
          "Le blocage vaut pour tout le site, depuis tous les écrans.",
          "Le déblocage se fait de la même façon, avec effet immédiat.",
          "Une ligne de relance dont le destinataire est bloqué le dit, et propose l'appel téléphonique.",
        ],
      },
    ],
  },
  {
    href: "/admin/reprises",
    titre: "Reprises",
    date: "31 juillet 2026",
    resume:
      "Avant, une estimation partait en texte libre dans la fiche du client. Maintenant, c'est une pièce à part entière : chiffrée, datée, imprimable, et qui fait entrer la voiture au stock.",
    groupes: [
      {
        titre: "La saisie a sa propre page",
        points: [
          "La fenêtre qui s'évanouissait au premier clic de travers a disparu : l'estimation se remplit sur une page à elle.",
          "Les champs suivent l'ordre de la carte grise : immatriculation, mise en circulation, marque, modèle.",
          "Vingt informations au lieu de neuf, dont le numéro de série, le contrôle technique, le carnet d'entretien et les clés.",
          "Cocher « Crédit en cours » rappelle de demander le décompte au prêteur ; décocher « Carte grise au nom du vendeur » rappelle qu'il faut la signature du titulaire.",
          "Le bouton d'enregistrement reste collé en bas, avec l'offre et la marge sous les yeux.",
          "Un même vendeur reste sur une seule fiche, retrouvé par son email ou par les derniers chiffres de son téléphone.",
        ],
      },
      {
        titre: "On voit ce que l'affaire rapporte",
        points: [
          "Revente visée, remise en état et offre remise donnent la marge nette, recalculée pendant que vous tapez.",
          "La TVA sur marge est déduite : une marge annoncée de 6 410 € en vaut 3 942 une fois la taxe et les frais réglés.",
          "Un prix trop haut annonce la perte en clair, avant que l'offre parte.",
          "Chaque changement de prix laisse une trace datée et signée dans le journal de l'estimation.",
        ],
      },
      {
        titre: "Une offre a une fin",
        points: [
          "L'offre porte sa date et sa durée, quinze jours par défaut.",
          "La ligne annonce « valable 3 j », puis « échue depuis 5 j », avec un liseré de couleur.",
          "Les offres qui approchent de leur fin remontent dans « À faire aujourd'hui » et sur le tableau de bord.",
          "Une date de rappel se pose sur l'estimation, comme sur une affaire.",
        ],
      },
      {
        titre: "La liste devient une liste de travail",
        points: [
          "Une recherche retrouve une voiture par sa plaque, son numéro de série ou le nom du vendeur.",
          "Des pastilles filtrent par état, et trois chiffres en tête donnent les offres en cours, celles à relancer et ce qui a été acheté.",
          "Deux boutons en bout de ligne concluent une offre sans ouvrir la fiche, le refus demandant son motif.",
          "Sur téléphone, le nom du véhicule se lit en entier, là où il se réduisait à deux lettres.",
        ],
      },
      {
        titre: "De l'accord à la voiture au parc",
        points: [
          "Un bouton fait de l'estimation acceptée une fiche véhicule, hors ligne, prête à compléter.",
          "Son prix d'achat et sa remise en état sont déjà portés au suivi : la marge du stock est juste dès le premier jour.",
          "La fiche du parc garde le lien vers l'estimation et vers le vendeur.",
        ],
      },
      {
        titre: "Le vendeur repart avec un papier",
        points: [
          "Une offre A4 s'imprime, à l'en-tête de la société, avec le véhicule identifié, le montant, la validité et les conditions.",
          "Deux emplacements de signature y figurent.",
          "Des photos se déposent sur l'estimation : les quatre angles, le compteur, la carte grise.",
        ],
      },
    ],
  },
  {
    href: "/admin/audience",
    titre: "Audience",
    date: "3 août 2026",
    resume:
      "Un écran neuf : combien de personnes viennent sur le site, par quelle porte elles entrent, et ce que rapporte chaque annonce que vous publiez.",
    groupes: [
      {
        titre: "Les chiffres du site",
        points: [
          "Visites, pages vues et visiteurs, sur 7, 30 ou 90 jours.",
          "L'évolution face à la période précédente s'affiche à côté du chiffre.",
          "Une courbe suit les visites jour après jour, par semaine au-delà d'un mois.",
          "Le camembert des appareils dit si vos visiteurs arrivent du téléphone ou de l'ordinateur.",
        ],
      },
      {
        titre: "Savoir ce que rapporte une annonce",
        points: [
          "Un lien marqué se fabrique depuis l'écran : vous choisissez la page, le nom de la campagne, et vous copiez.",
          "Le lien peut ouvrir la page directement sur son formulaire.",
          "Le tableau « Par lien » donne les visites reçues par chaque annonce, chaque flyer, chaque signature d'email.",
          "Le marqueur suit le visiteur de page en page : un clic venu de Leboncoin reste attribué sur la fiche ouverte trois pages plus loin.",
        ],
      },
      {
        titre: "Par où ils passent",
        points: [
          "« Comment ils arrivent » range chaque visite : lien marqué, moteur de recherche, portail auto, réseaux sociaux, accès direct.",
          "« Provenance » liste les sites qui renvoient vers le vôtre.",
          "« Pages » donne les pages les plus vues, et celles par lesquelles les visiteurs entrent.",
          "Un journal des trente derniers passages permet de voir arriver les visites en direct.",
        ],
      },
      {
        titre: "Une mesure discrète",
        points: [
          "La mesure reste anonyme : aucun nom, et l'adresse IP demeure à l'écart des enregistrements.",
          "Les visites sont conservées treize mois, puis effacées d'elles-mêmes.",
          "Votre propre navigation en tant qu'administrateur reste hors du comptage, comme les robots des moteurs de recherche.",
          "Les mentions légales du site décrivent cette mesure, en français et en anglais.",
        ],
      },
    ],
  },
];

export function nouveautePour(href: string | undefined): Nouveaute | undefined {
  return href ? NOUVEAUTES.find((n) => n.href === href) : undefined;
}
