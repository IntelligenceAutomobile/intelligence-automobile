import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Interdiction partagée : le service d'envoi ne se parle que depuis le mailer.
const PORTE_EMAILS = {
  name: "resend",
  message:
    "Passez par sendMail() de src/lib/mailer.ts : il retient les messages qui pourraient atteindre une vraie adresse, et refuse ceux de la liste rouge.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // ── Une seule porte de sortie pour les emails ──
  // Des messages d'essai sont partis vers l'adresse d'un vrai prospect depuis
  // un poste de développement. src/lib/mailer.ts retient tout ce qui pourrait
  // atteindre une vraie personne hors production, et refuse les destinataires
  // en liste rouge même en production : personne d'autre ne parle au service
  // d'envoi, sinon le garde-fou est contournable.
  //
  // La portée couvre TOUT le dépôt, scripts inclus et quelle que soit
  // l'extension : c'est un script lancé depuis un poste de développement qui a
  // écrit au prospect, et l'ancienne portée « src/**/*.{ts,tsx} » les laissait
  // tous dehors.
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,mts,cts}"],
    ignores: ["src/lib/mailer.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: [PORTE_EMAILS] }],
    },
  },
  // ── Étanchéité de la démonstration publique ──
  // La démo /demopro est servie sur le domaine live (branché sur la vraie base
  // Turso). Aucun de ses fichiers ne doit importer la base, l'authentification
  // ou le client Prisma : la démo doit rendre UNIQUEMENT des données d'exemple
  // figées. Toute violation fait échouer le lint (donc le build).
  //
  // Ce bloc vient après celui des emails et porte sur les mêmes fichiers : une
  // règle réglée deux fois est remplacée, jamais fusionnée. L'interdiction du
  // service d'envoi est donc reprise ici, sinon elle disparaissait pour toute
  // la démo, et l'étanchéité de la démo disparaissait pour ses fichiers .ts.
  {
    files: ["src/app/demopro/**/*.{ts,tsx}", "src/lib/demo-data.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [PORTE_EMAILS],
          patterns: [
            {
              group: [
                "@/lib/prisma", "**/lib/prisma",
                "@/lib/auth", "**/lib/auth",
                "@/lib/collab-auth", "**/lib/collab-auth",
                "@/lib/crm-intake", "**/lib/crm-intake",
                "@/generated/prisma", "**/generated/prisma", "@/generated/prisma/**",
              ],
              message:
                "Interdit dans la démo /demopro : aucun accès à la base réelle ni à l'authentification. Utilisez src/lib/demo-data.ts (données d'exemple figées).",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
