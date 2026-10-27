import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** Limpa o Postgres de e2e e recria as contas, inclusive a arena inadimplente. */
export default function globalSetup() {
  const apiDir = process.env.E2E_API_DIR || path.resolve(root, "../../mpn-api");
  execFileSync("npm", ["run", "db:seed:e2e"], {
    cwd: apiDir,
    stdio: "inherit",
    env: process.env,
  });
}
