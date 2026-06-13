import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, photos } from "@/lib/schema";
import { deleteFromCloudinary } from "@/lib/storage";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const activityId = parseInt(id);
  if (isNaN(activityId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  try {
    // Ambil semua foto terkait
    const activityPhotos = await db
      .select()
      .from(photos)
      .where(eq(photos.activityId, activityId));

    // Hapus dari Cloudinary
    for (const photo of activityPhotos) {
      await deleteFromCloudinary(photo.driveFileId);
    }

    // Hapus metadata foto
    await db.delete(photos).where(eq(photos.activityId, activityId));

    // Hapus kegiatan
    await db.delete(activities).where(eq(activities.id, activityId));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menghapus";
    console.error("Delete error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}