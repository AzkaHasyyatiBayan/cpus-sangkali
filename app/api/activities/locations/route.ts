import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities } from "@/lib/schema";
import { DEFAULT_LOCATIONS } from "@/lib/constants";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const dbLocations = await db
      .select({ location: activities.location })
      .from(activities)
      .where(sql`${activities.location} IS NOT NULL`)
      .groupBy(activities.location)
      .orderBy(activities.location);

    const dbStrings = dbLocations.map((l) => l.location!).filter(Boolean);
    const seen = new Set<string>();
    const unique: string[] = [];
    [...dbStrings, ...DEFAULT_LOCATIONS].forEach((loc) => {
      const norm = loc.trim().toLowerCase();
      if (!seen.has(norm)) {
        seen.add(norm);
        unique.push(loc.trim());
      }
    });
    unique.sort((a, b) => a.localeCompare(b, "id"));
    return NextResponse.json({ success: true, data: unique });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengambil lokasi";
    console.error("Failed to fetch locations:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}