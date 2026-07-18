import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, photos } from "@/lib/schema";
import { deleteFromCloudinary } from "@/lib/storage";
import { and, lt, eq, isNotNull } from "drizzle-orm";

export async function GET() {
  try {
    // Hitung tanggal 30 hari yang lalu
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Ambil semua foto yang dihapus lebih dari 30 hari lalu
    const oldDeletedPhotos = await db
      .select()
      .from(photos)
      .where(
        and(
          isNotNull(photos.deletedAt),
          lt(photos.deletedAt, thirtyDaysAgo)
        )
      );

    let deletedCount = 0;

    for (const photo of oldDeletedPhotos) {
      try {
        // Hapus dari Cloudinary
        await deleteFromCloudinary(photo.driveFileId);
        
        // Hapus dari Database
        await db.delete(photos).where(eq(photos.id, photo.id));
        deletedCount++;
      } catch (err) {
        console.error(`Gagal hapus permanen foto ID ${photo.id}:`, err);
      }
    }

    // 2. Bersihkan kegiatan yang tidak punya foto lagi
    const allActivities = await db.select().from(activities);
    for (const act of allActivities) {
      const remainingPhotos = await db
        .select()
        .from(photos)
        .where(eq(photos.activityId, act.id));
      
      if (remainingPhotos.length === 0) {
        await db.delete(activities).where(eq(activities.id, act.id));
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil menghapus ${deletedCount} foto lama dari trash.` 
    });
  } catch (error: unknown) {
    console.error("Auto delete trash error:", error);
    return NextResponse.json({ error: "Gagal menjalankan auto delete" }, { status: 500 });
  }
}