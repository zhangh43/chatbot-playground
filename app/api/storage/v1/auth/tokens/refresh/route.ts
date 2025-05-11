import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

/**
 * POST /api/storage/v1/auth/tokens/refresh
 * Refresh an existing token
 * @param refresh_token The refresh token to use
 * @example
 * {
 *   "refresh_token": "refresh_0jovoiwjd1hU3l24iy4iGIXu"
 * }
 * @returns A new access token
 */
export async function POST(req: Request) {
  try {
    console.log("Processing token refresh request");

    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { refresh_token } = body;

    if (!refresh_token) {
      console.error("Missing refresh token in request");
      return NextResponse.json(
        { error: "Missing refresh token" },
        { status: 400 }
      );
    }

    // Generate access token
    const now = Math.floor(Date.now() / 1000);
    const accessTokenPayload = {
      workspace_id: "",
      project_id: "",
      iat: now,
      nbf: now - 10, // Allow 10 seconds of clock skew
      exp: now + 3600, // Access token expires in 1 hour
      iss: "",
      sub: "",
      type: "anonymous"
    };

    const response = {
      access_token: jwt.sign(accessTokenPayload, SECRET_KEY),
    };

    console.log("Token refreshed successfully");
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
