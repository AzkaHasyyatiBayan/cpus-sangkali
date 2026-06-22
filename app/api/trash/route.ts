import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, photos } from "@/lib/schema";
import { eq, isNotNull, desc } from "drizzle-orm";

export async function GET() {
  try {
    const results = await db
      .select({
        id: photos.id,
        driveFileId: photos.driveFileId,
        fileName: photos.fileName,
        activityDate: photos.activityDate,
        location: photos.location,
        uploader: photos.uploader,
        deletedAt: photos.deletedAt,
        title: activities.title,
      })
      .from(photos)
      .leftJoin(activities, eq(photos.activityId, activities.id))
      .where(isNotNull(photos.deletedAt))
      .orderBy(desc(photos.deletedAt));

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Trash fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil data trash" }, { status: 500 });
  }
}