import { google } from "googleapis";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

interface GoogleToken {
  access_token: string;
  refresh_token: string | null;
  expiry_date: number | null;
}

type GoogleDriveClient = ReturnType<typeof google.drive>;

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

async function getOrCreateFolder(drive: GoogleDriveClient, folderName: string, parentFolderId: string): Promise<string> {
  const res = await drive.files.list({
    q: `'${parentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  const createRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
  });

  return createRes.data.id!;
}

export async function uploadBackupToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  activityTitle: string,
  activityDate: string
): Promise<string> {
  const drive = await getGoogleDriveClient();
  const { Readable } = await import("stream");

  const rootFolderId = process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID || "";
  
  // 1. Buat/ambil folder Bulan (format: YYYY-MM)
  const monthStr = activityDate.substring(0, 7); 
  const monthFolderId = await getOrCreateFolder(drive, monthStr, rootFolderId);

  // 2. Buat/ambil folder Nama Kegiatan
  const safeActivityTitle = activityTitle.replace(/[^a-zA-Z0-9]/g, "_");
  const activityFolderId = await getOrCreateFolder(drive, safeActivityTitle, monthFolderId);

  // 3. Upload file ke dalam folder kegiatan tersebut
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [activityFolderId],
    },
    media: {
      mimeType,
      body: Readable.from(fileBuffer),
    },
    fields: "id",
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