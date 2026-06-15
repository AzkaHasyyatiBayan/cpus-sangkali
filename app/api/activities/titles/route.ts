import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities } from "@/lib/schema";
import { DEFAULT_ACTIVITY_TITLES } from "@/lib/constants";

export async function GET() {
  try {
    const dbTitles = await db
      .select({ title: activities.title })
      .from(activities)
      .groupBy(activities.title)
      .orderBy(activities.title);

    const dbTitleStrings = dbTitles.map((t) => t.title);
    const seen = new Set<string>();
    const unique: string[] = [];

    // Prioritaskan yang sudah ada di DB, lalu default
    [...dbTitleStrings, ...DEFAULT_ACTIVITY_TITLES].forEach((title) => {
      const norm = title.trim().toLowerCase();
      if (!seen.has(norm)) {
        seen.add(norm);
        unique.push(title.trim());
      }
    });

    unique.sort((a, b) => a.localeCompare(b, "id"));

    return NextResponse.json({ success: true, data: unique });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengambil judul";
    console.error("Failed to fetch titles:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}