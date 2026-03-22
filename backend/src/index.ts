import { Elysia } from "elysia";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const dataDir = join(import.meta.dir, "..", "data");

function getValidCategories(): string[] {
  if (!existsSync(dataDir)) return [];
  return readdirSync(dataDir)
    .filter((f) => f.endsWith(".csv"))
    .map((f) => f.replace(".csv", "").toLowerCase());
}

function loadCsv(category: string): { palabra: string; pista: string }[] {
  const filePath = join(dataDir, `${category}.csv`);

  if (!existsSync(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");
  const entries: { palabra: string; pista: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^([^,]+),(.*)$/);
    if (match) {
      entries.push({
        palabra: match[1].trim(),
        pista: match[2].trim(),
      });
    }
  }

  return entries;
}

function getRandomWord(category: string): { palabra: string; pista: string } | null {
  const entries = loadCsv(category);
  if (entries.length === 0) return null;
  return entries[Math.floor(Math.random() * entries.length)];
}

const app = new Elysia()
  .use(
    // CORS para permitir requests desde Vercel/frontend
    (app) =>
      app.onBeforeHandle(({ set, request }) => {
        const origin = request.headers.get("origin");
        set.headers["Access-Control-Allow-Origin"] = origin || "*";
        set.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
        set.headers["Access-Control-Allow-Headers"] = "Content-Type";
      })
  )
  .onBeforeHandle(({ request, set }) => {
    if (request.method === "OPTIONS") {
      set.status = 204;
      return "";
    }
  })
  .get("/palabra", ({ query, set }) => {
    const categoria = query.categoria?.toLowerCase();
    const validCategories = getValidCategories();

    if (!categoria || !validCategories.includes(categoria)) {
      set.status = 400;
      return {
        error: "Categoría inválida",
        categoriasValidas: validCategories,
      };
    }

    const result = getRandomWord(categoria);
    if (!result) {
      set.status = 500;
      return { error: "No hay datos para esta categoría" };
    }

    return result;
  })
  .get("/health", () => ({ ok: true }))
  .listen(process.env.PORT || 3000);

console.log(`🎭 Impostor API running at http://localhost:${app.server?.port}`);
