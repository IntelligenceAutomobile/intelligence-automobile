import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
  // ── Étanchéité de la démonstration publique ──
  // La démo /demopro est servie sur le domaine live (branché sur la vraie base
  // Turso). Aucun de ses fichiers ne doit importer la base, l'authentification
  // ou le client Prisma : la démo doit rendre UNIQUEMENT des données d'exemple
  // figées. Toute violation fait échouer le lint (donc le build).
  {
    files: ["src/app/demopro/**/*.{ts,tsx}", "src/lib/demo-data.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
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
