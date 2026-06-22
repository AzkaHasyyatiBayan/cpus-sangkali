import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const photoId = parseInt(id);
  if (isNaN(photoId)) {
    return NextResponse.json({ error: "ID foto tidak valid" }, { status: 400 });
  }

  try {
    await db
      .update(photos)
      .set({ deletedAt: null })
      .where(eq(photos.id, photoId));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal restore foto";
    console.error("Restore photo error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}