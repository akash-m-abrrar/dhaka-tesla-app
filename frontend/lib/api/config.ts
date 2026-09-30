const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

if (!apiBaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is required. Set it in frontend/.env.local (see frontend/.env.example).",
  );
}

let parsedBaseUrl: URL;

try {
  parsedBaseUrl = new URL(apiBaseUrl);
} catch {
  throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) URL.");
}

if (
  (parsedBaseUrl.protocol !== "http:" && parsedBaseUrl.protocol !== "https:") ||
  parsedBaseUrl.search ||
  parsedBaseUrl.hash
) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL must be an HTTP(S) URL without a query string or fragment.",
  );
}

export const API_BASE_URL = apiBaseUrl.replace(/\/+$/, "");

export function resolveApiUrl(path: string): string {
  const relativePath = path.replace(/^\/+/, "");

  if (!relativePath) {
    throw new Error("API endpoint path must not be empty.");
  }

  return `${API_BASE_URL}/${relativePath}`;
}
