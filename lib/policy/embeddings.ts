// Optional dense-vector embeddings via Voyage AI (Anthropic's recommended
// embeddings partner). When VOYAGE_API_KEY is absent, retrieval falls back
// to Postgres full-text search — the app works either way.

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3";

export function isEmbeddingConfigured() {
  return Boolean(process.env.VOYAGE_API_KEY);
}

export async function embedTexts(
  texts: string[],
  inputType: "document" | "query",
): Promise<number[][] | null> {
  if (!isEmbeddingConfigured() || texts.length === 0) return null;

  const response = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      input: texts,
      model: VOYAGE_MODEL,
      input_type: inputType,
    }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    data?: Array<{ embedding: number[]; index: number }>;
  };
  if (!payload.data) return null;

  const sorted = [...payload.data].sort((a, b) => a.index - b.index);
  return sorted.map((entry) => entry.embedding);
}
