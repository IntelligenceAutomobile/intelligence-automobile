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
    date: "30 juillet 2026",
    resume:
      "Une personne peut demander ce que vous détenez sur elle, et son effacement. Vous répondez en un clic, sans rien perdre de ce que la loi impose de garder.",
    groupes: [
      {
        titre: "Répondre à une demande",
        points: [
          "« Copie de ses données » produit un fichier avec tout : fiche, pistes, échanges, devis, factures, rendez-vous, garanties, immatriculations.",
          "Le délai légal de réponse est d'un mois, rappelé à l'écran.",
        ],
      },
      {
        titre: "Effacer, sans casser la comptabilité",
        points: [
          "La fenêtre annonce à l'avance ce qui part et ce qui reste.",
          "Effacés : la fiche, les pistes, les rendez-vous, les garanties, et les devis jamais facturés.",
          "Conservés : les factures et avoirs, avec le nom et l'adresse, que la loi impose de garder dix ans. L'email et le téléphone en sont retirés.",
          "Le lien public d'un devis anonymisé cesse de s'ouvrir.",
          "Une trace de la demande reste sur la fiche : c'est votre registre.",
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
];

export function nouveautePour(href: string | undefined): Nouveaute | undefined {
  return href ? NOUVEAUTES.find((n) => n.href === href) : undefined;
}
