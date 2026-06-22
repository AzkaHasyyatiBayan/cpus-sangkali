import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos } from "@/lib/schema";
import { isNull, eq, and } from "drizzle-orm";
import AdmZip from "adm-zip";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("activityId");

    // Filter: per kegiatan atau semua
    const conditions = [isNull(photos.deletedAt)];
    if (activityId) {
      conditions.push(eq(photos.activityId, Number(activityId)));
    }

    const allPhotos = await db
      .select()
      .from(photos)
      .where(and(...conditions));

    if (allPhotos.length === 0) {
      return NextResponse.json({ error: "Tidak ada foto untuk dibackup" }, { status: 400 });
    }

    const zip = new AdmZip();

    for (const photo of allPhotos) {
      const url = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${photo.driveFileId}`;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          const ext = photo.mimeType === "image/webp" ? "webp" : "jpg";
          zip.addFile(`${photo.fileName || photo.driveFileId}.${ext}`, buffer);
        }
      } catch (e) {
        console.error(`Gagal fetch foto ${photo.id}:`, e);
      }
    }

    const zipBuffer = zip.toBuffer();

    const label = activityId ? `kegiatan-${activityId}` : "semua";
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="backup-${label}-${new Date().toISOString().split("T")[0]}.zip"`,
      },
    });
  } catch (error: unknown) {
    console.error("Backup download error:", error);
    return NextResponse.json({ error: "Gagal membuat backup" }, { status: 500 });
  }
}