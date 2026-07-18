import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, photos } from "@/lib/schema";
import { inArray, isNull, and, eq } from "drizzle-orm";
import AdmZip from "adm-zip";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { activityIds } = body;

    if (!activityIds || activityIds.length === 0) {
      return NextResponse.json({ error: "Tidak ada kegiatan yang dipilih" }, { status: 400 });
    }

    const allPhotos = await db
      .select({
        activityTitle: activities.title,
        activityDate: photos.activityDate,
        fileName: photos.fileName,
        driveFileId: photos.driveFileId,
      })
      .from(photos)
      .leftJoin(activities, eq(photos.activityId, activities.id))
      .where(and(inArray(photos.activityId, activityIds), isNull(photos.deletedAt)));

    if (allPhotos.length === 0) {
      return NextResponse.json({ error: "Tidak ada foto untuk dibackup" }, { status: 400 });
    }

    const zip = new AdmZip();
    const sharp = (await import("sharp")).default;

    for (const item of allPhotos) {
      const url = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${item.driveFileId}`;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          const pngBuffer = await sharp(buffer).png().toBuffer();

          const safeActivityName = (item.activityTitle || "Tanpa_Judul").replace(/[^a-zA-Z0-9]/g, "_");
          const safeDate = item.activityDate || "Tanpa_Tanggal";
          const safeFileName = (item.fileName || item.driveFileId).replace(/\.\w+$/, "");
          
          const folderPath = `${safeActivityName}/${safeDate}/`;
          zip.addFile(`${folderPath}${safeFileName}.png`, pngBuffer);
        }
      } catch (e) {
        console.error(`Gagal fetch foto ${item.driveFileId}:`, e);
      }
    }

    const zipBuffer = zip.toBuffer();
    const today = new Date().toISOString().split("T")[0];

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="backup-kegiatan-${today}.zip"`,
      },
    });
  } catch (_error) { 
    console.error("Bulk download error:", _error);
    return NextResponse.json({ error: "Gagal membuat backup" }, { status: 500 });
  }
}