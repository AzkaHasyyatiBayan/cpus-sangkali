import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities } from "@/lib/schema";

export async function GET() {
  try {
    const titles = await db
      .select({ title: activities.title })
      .from(activities)
      .groupBy(activities.title)
      .orderBy(activities.title);

    const uniqueTitles = titles.map((t) => t.title);

    return NextResponse.json({
      success: true,
      data: uniqueTitles,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal mengambil judul";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}