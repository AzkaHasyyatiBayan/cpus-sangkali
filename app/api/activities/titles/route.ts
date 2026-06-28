import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities } from "@/lib/schema";
import { DEFAULT_ACTIVITY_TITLES, filterTitlesByCategory } from "@/lib/constants";

// Normalize title untuk deduplication
function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";

    const dbTitles = await db
      .select({ title: activities.title })
      .from(activities)
      .groupBy(activities.title)
      .orderBy(activities.title);

    const dbTitleStrings = dbTitles.map((t) => t.title);
    
    // Gunakan Map untuk deduplication berdasarkan normalized title
    const uniqueMap = new Map<string, string>();

    // Prioritaskan yang sudah ada di DB, lalu default
    [...dbTitleStrings, ...DEFAULT_ACTIVITY_TITLES].forEach((title) => {
      const normalized = normalizeTitle(title);
      if (!uniqueMap.has(normalized)) {
        uniqueMap.set(normalized, title.trim());
      }
    });

    let unique = Array.from(uniqueMap.values());

    console.log(`[Titles API] Total unique titles before filter: ${unique.length}`);

    // Filter berdasarkan category jika ada
    if (category && category !== "all" && category !== "") {
      const beforeCount = unique.length;
      unique = filterTitlesByCategory(unique, category);
      console.log(`[Titles API] Category: ${category}, Before: ${beforeCount}, After: ${unique.length}`);
    }

    unique.sort((a, b) => a.localeCompare(b, "id"));

    return NextResponse.json({ success: true, data: unique });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengambil judul";
    console.error("Failed to fetch titles:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}