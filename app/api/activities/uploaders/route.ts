import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities } from "@/lib/schema";
import { DEFAULT_UPLOADERS } from "@/lib/constants";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const dbUploaders = await db
      .select({ uploader: activities.uploader })
      .from(activities)
      .where(sql`${activities.uploader} IS NOT NULL`)
      .groupBy(activities.uploader)
      .orderBy(activities.uploader);

    const dbStrings = dbUploaders.map((u) => u.uploader!).filter(Boolean);
    const seen = new Set<string>();
    const unique: string[] = [];
    [...dbStrings, ...DEFAULT_UPLOADERS].forEach((u) => {
      const norm = u.trim().toLowerCase();
      if (!seen.has(norm)) {
        seen.add(norm);
        unique.push(u.trim());
      }
    });
    unique.sort((a, b) => a.localeCompare(b, "id"));
    return NextResponse.json({ success: true, data: unique });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengambil uploader";
    console.error("Failed to fetch uploaders:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}