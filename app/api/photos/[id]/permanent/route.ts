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
  const photoId = parseInt(id);
  if (isNaN(photoId)) {
    return NextResponse.json({ error: "ID foto tidak valid" }, { status: 400 });
  }

  try {
    const [photo] = await db
      .select()
      .from(photos)
      .where(eq(photos.id, photoId));

    if (!photo) {
      return NextResponse.json({ error: "Foto tidak ditemukan" }, { status: 404 });
    }

    // Hapus dari Cloudinary
    try {
      await deleteFromCloudinary(photo.driveFileId);
    } catch (e) {
      console.error("Gagal hapus dari Cloudinary:", e);
    }

    // Hapus dari database
    await db.delete(photos).where(eq(photos.id, photoId));

    // Cek sisa foto di kegiatan
    const remaining = await db
      .select()
      .from(photos)
      .where(eq(photos.activityId, photo.activityId));

    if (remaining.length === 0) {
      await db.delete(activities).where(eq(activities.id, photo.activityId));
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menghapus permanen";
    console.error("Permanent delete error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}