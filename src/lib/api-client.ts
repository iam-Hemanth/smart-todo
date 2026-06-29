/**
 * Custom fetch wrapper for internal API requests.
 * Since client-side requests are same-origin, they are trusted by default
 * without needing to compile sensitive tokens into the browser bundle.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, options);
}
