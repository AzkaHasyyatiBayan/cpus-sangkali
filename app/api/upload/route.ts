import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, photos } from "@/lib/schema";
import { uploadToGoogleDrive } from "@/lib/storage";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const activityDate = formData.get("date") as string;

    if (!file || !title || !activityDate) {
      return NextResponse.json(
        { error: "File, judul, dan tanggal wajib diisi" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File harus berupa gambar" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const driveFileId = await uploadToGoogleDrive(
      buffer,
      `${title}_${Date.now()}_${file.name}`
    );

    let [activity] = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.title, title),
          eq(activities.activityDate, activityDate)
        )
      )
      .limit(1);

    if (!activity) {
      [activity] = await db
        .insert(activities)
        .values({
          title,
          activityDate,
        })
        .returning();
    }

    const [photo] = await db
      .insert(photos)
      .values({
        activityId: activity.id,
        driveFileId,
        fileName: file.name,
        mimeType: file.type,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        photo,
        activity,
        thumbnailUrl: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,c_fill/${driveFileId}`,
      },
    });
  } catch (error: unknown) {
    console.error("=== UPLOAD ERROR ===");
    console.error("Error name:", error instanceof Error ? error.name : "Unknown");
    console.error("Error message:", error instanceof Error ? error.message : error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengunggah foto" },
      { status: 500 }
    );
  }
}