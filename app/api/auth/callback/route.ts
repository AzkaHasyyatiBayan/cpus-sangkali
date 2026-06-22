import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback`
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // Absolute URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/setup-backup?error=no_code`);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS google_token (
        id SERIAL PRIMARY KEY,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expiry_date BIGINT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      INSERT INTO google_token (access_token, refresh_token, expiry_date)
      VALUES (${tokens.access_token}, ${tokens.refresh_token || null}, ${tokens.expiry_date || null})
    `);

    return NextResponse.redirect(`${baseUrl}/setup-backup?success=true`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${baseUrl}/setup-backup?error=token_failed`);
  }
}