import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos } from "@/lib/schema";
import { inArray, isNull, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { activityIds } = body;

    if (!activityIds || activityIds.length === 0) {
      return NextResponse.json({ error: "Tidak ada kegiatan yang dipilih" }, { status: 400 });
    }

    await db
      .update(photos)
      .set({ deletedAt: new Date() })
      .where(
        and(
          inArray(photos.activityId, activityIds),
          isNull(photos.deletedAt)
        )
      );

    return NextResponse.json({ success: true, message: "Kegiatan berhasil dipindahkan ke trash" });
  } catch (_error) { // ✅ PERBAIKAN: Gunakan _error agar tidak warning unused
    console.error("Bulk delete error:", _error);
    return NextResponse.json({ error: "Gagal memindahkan ke trash" }, { status: 500 });
  }
}