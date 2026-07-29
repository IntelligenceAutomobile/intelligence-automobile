// Qui a le droit d'écrire quoi sur le stockage de fichiers.
// Module neutre, sans hook ni accès base : la règle est isolée de la route pour
// rester lisible et vérifiable, comme les autres règles métier du dépôt.
//
// Le stockage sert DEUX publics, et le dépôt n'a aucun middleware :
//   • le visiteur du formulaire « aide à la vente » (/revente-sur-mesure), qui
//     joint les photos et les papiers de sa voiture — jamais connecté ;
//   • le back-office (fiche véhicule, pièces jointes des réunions).
// Sans ce partage, n'importe qui obtenait un jeton pour écrire où il voulait.

// Le seul dossier ouvert sans session.
export const PUBLIC_PREFIX = "aide-vente/";

// Dossier des pièces jointes du back-office (documents et papiers scannés).
export const DOC_PREFIX = "documents/";

export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
  "image/tiff",
  "image/bmp",
  "image/avif",
];

export const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const MB = 1024 * 1024;

export type UploadRule = {
  allowedContentTypes: string[];
  maximumSizeInBytes: number;
  addRandomSuffix?: boolean;
};

// Renvoie les règles applicables, ou null si l'envoi doit être refusé.
export function uploadRule(pathname: string, isAdmin: boolean): UploadRule | null {
  const path = String(pathname ?? "");

  if (!isAdmin) {
    // Le dossier du formulaire public, et lui seul : un anonyme reste hors des
    // photos du stock et des pièces jointes internes. Le test rejette aussi les
    // remontées de chemin (« aide-vente/../vehicules/x.jpg »).
    if (!path.startsWith(PUBLIC_PREFIX) || path.includes("..")) return null;
    return {
      allowedContentTypes: [...IMAGE_TYPES, ...DOC_TYPES],
      maximumSizeInBytes: 10 * MB, // large pour une photo de téléphone
      // Deux visiteurs qui envoient « photo.jpg » le même jour gardent chacun le sien.
      addRandomSuffix: true,
    };
  }

  // Back-office : les pièces jointes acceptent PDF, images et bureautique ;
  // les photos du véhicule restent strictement des images.
  if (path.startsWith(DOC_PREFIX)) {
    return { allowedContentTypes: [...IMAGE_TYPES, ...DOC_TYPES], maximumSizeInBytes: 25 * MB };
  }
  return { allowedContentTypes: IMAGE_TYPES, maximumSizeInBytes: 15 * MB };
}
