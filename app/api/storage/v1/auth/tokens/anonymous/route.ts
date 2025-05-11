import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

/**
 * POST /api/storage/v1/auth/tokens/anonymous
 * Get anonymous token
 * @returns jwt token and refresh token
 */
export async function POST() {
  try {
    console.log("Generating anonymous token");

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

    // Generate new refresh token
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30); // Expires in 30 days

    const refreshToken = `refresh_${crypto.randomUUID().replace(/-/g, "")}`;

    const response = {
      access_token: jwt.sign(accessTokenPayload, SECRET_KEY),
      refresh_token: {
        token: refreshToken,
        expires_at: refreshTokenExpiry.toISOString(),
      },
    };

    console.log("Anonymous token generated successfully");
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating anonymous token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
