import { NextResponse } from "next/server";
import { getCloudinaryUsage } from "@/lib/storage";
import { db } from "@/lib/db";
import { photos } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const usage = await getCloudinaryUsage();
    return NextResponse.json({ success: true, data: usage });
  } catch (error) {
    console.error("Gagal mengambil storage usage dari Cloudinary:", error);
    
    // Fallback: kalau Cloudinary API gagal, hitung dari DB
    try {
      const result = await db
        .select({ totalSize: sql<number>`COALESCE(SUM(size), 0)` })
        .from(photos);

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
    } catch (dbError) {
      console.error("Fallback DB error:", dbError);
      return NextResponse.json({ error: "Gagal mengambil data storage" }, { status: 500 });
    }
  }
}