import { NextResponse } from "next/server";

/**
 * Validates request authorization.
 * 
 * 1. Same-Origin Check:
 *    If the request is same-origin (checked via standard Sec-Fetch-Site header
 *    or fallback Referer vs. Host comparison), it is trusted by default without
 *    needing client-side secrets.
 * 
 * 2. External Check:
 *    If the request is external (e.g. iOS Shortcut, curl, external API script),
 *    it checks the request's Authorization header against PERSONAL_API_TOKEN.
 *
 * Returns a NextResponse (401 or 500) if validation fails, or null if authorized.
 */
export function checkAuth(req: Request): NextResponse | null {
  const secFetchSite = req.headers.get("sec-fetch-site");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  let isSameOrigin = false;

  if (secFetchSite === "same-origin") {
    isSameOrigin = true;
  } else if (referer && host) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host === host) {
        isSameOrigin = true;
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  // Same-origin browser fetch requests are allowed automatically
  if (isSameOrigin) {
    return null;
  }

  // External requests require verification against the server-only token
  const token = process.env.PERSONAL_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Server Configuration Error: PERSONAL_API_TOKEN is not defined on the server" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized: Missing or malformed Authorization header for external request" },
      { status: 401 }
    );
  }

  const clientToken = authHeader.substring(7);
  if (clientToken !== token) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid personal API token" },
      { status: 401 }
    );
  }

  return null;
}
