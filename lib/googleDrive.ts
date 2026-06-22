import { google } from "googleapis";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

interface GoogleToken {
  access_token: string;
  refresh_token: string | null;
  expiry_date: number | null;
}

export async function getGoogleDriveClient() {
  const result = await db.execute(sql`
    SELECT access_token, refresh_token, expiry_date 
    FROM google_token 
    ORDER BY created_at DESC 
    LIMIT 1
  `);

  const token = result.rows[0] as unknown as GoogleToken;
  if (!token) throw new Error("Token tidak ditemukan. Jalankan setup backup dulu.");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback`
  );

  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token ?? undefined,
    expiry_date: token.expiry_date ?? undefined,
  });

  oauth2Client.on("tokens", async (newTokens) => {
    await db.execute(sql`
      UPDATE google_token 
      SET access_token = ${newTokens.access_token}, 
          expiry_date = ${newTokens.expiry_date}
      WHERE access_token = ${token.access_token}
    `);
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

export async function uploadBackupToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const drive = await getGoogleDriveClient();
  const { Readable } = await import("stream");

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID || ""],
    },
    media: {
      mimeType,
      body: Readable.from(fileBuffer),
    },
  });

  return response.data.id || "";
}

export async function getGoogleDriveStorage(): Promise<{
  used: number;
  limit: number;
  percent: number;
} | null> {
  try {
    const drive = await getGoogleDriveClient();
    const res = await drive.about.get({
      fields: "storageQuota",
    });
    const quota = res.data.storageQuota;
    if (!quota || !quota.usage || !quota.limit) return null;
    const used = parseInt(quota.usage);
    const limit = parseInt(quota.limit);
    return {
      used,
      limit,
      percent: (used / limit) * 100,
    };
  } catch {
    return null;
  }
}