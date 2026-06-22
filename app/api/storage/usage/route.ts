import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos } from "@/lib/schema";
import { sql, isNull } from "drizzle-orm";

export async function GET() {
  try {
    // Hitung dari DB — hanya foto yang belum dihapus
    const result = await db
      .select({ totalSize: sql<number>`COALESCE(SUM(size), 0)` })
      .from(photos)
      .where(isNull(photos.deletedAt));

    const totalSize = Number(result[0].totalSize) || 0;
    const limitBytes = 25 * 1024 * 1024 * 1024; // 25 GB

    return NextResponse.json({
      success: true,
      data: {
        used: totalSize,
        limit: limitBytes,
        percent: (totalSize / limitBytes) * 100,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil storage usage:", error);
    return NextResponse.json({ error: "Gagal mengambil data storage" }, { status: 500 });
  }
}