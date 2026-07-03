// Lance l'instance SHOWROOM (port 3001) sur la base locale demo.db.
// Étanchéité : DATABASE_URL est forcée sur demo.db et le jeton Turso est
// retiré — cette instance ne PEUT PAS toucher la base réelle. Seules les
// clés utiles à la démo (assistant IA, upload) sont reprises de .env.
import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";

if (!existsSync("demo.db")) {
  console.error("demo.db introuvable — lancer d'abord : npx tsx scripts/setup-showroom.mts");
  process.exit(1);
}

const parsed = {};
try {
  for (const raw of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = raw.match(/^\s*([\w]+)\s*=\s*(.*?)\s*$/);
    if (m) parsed[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* pas de .env : la démo tourne sans IA ni upload */
}

const env = {
  ...process.env,
  // Allowlist volontaire : rien d'autre ne passe de l'instance réelle.
  ANTHROPIC_API_KEY: parsed.ANTHROPIC_API_KEY ?? "",
  BLOB_READ_WRITE_TOKEN: parsed.BLOB_READ_WRITE_TOKEN ?? "",
  DATABASE_URL: "file:./demo.db",
  SHOWROOM: "1",
};
delete env.TURSO_AUTH_TOKEN;

// Mode production : pas de conflit avec le serveur de dev (port 3000) et
// des pages instantanées en démo. Après une mise à jour du code : npm run build.
if (!existsSync(".next/BUILD_ID") && !existsSync(".next/build")) {
  console.error("Aucun build trouvé — lancer d'abord : npm run build");
  process.exit(1);
}

console.log("Showroom : http://localhost:3001/admin (base demo.db isolée, mode production)");
const child = spawn("npx", ["next", "start", "-p", "3001"], { stdio: "inherit", shell: true, env });
child.on("exit", (code) => process.exit(code ?? 0));
