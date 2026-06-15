import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, photos } from "@/lib/schema";
import { uploadToGoogleDrive } from "@/lib/storage";
import { eq } from "drizzle-orm";
import { MAX_DESCRIPTION_WORDS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const activityDate = formData.get("date") as string;
    const description = formData.get("description") as string | null;
    const location = formData.get("location") as string | null;
    const uploader = formData.get("uploader") as string | null;

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

    if (description) {
      const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > MAX_DESCRIPTION_WORDS) {
        return NextResponse.json(
          { error: `Deskripsi maksimal ${MAX_DESCRIPTION_WORDS} kata` },
          { status: 400 }
        );
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSize = buffer.length;

    const driveFileId = await uploadToGoogleDrive(
      buffer,
      `${title}_${Date.now()}_${file.name}`
    );

    let [activity] = await db
      .select()
      .from(activities)
      .where(eq(activities.title, title.trim()))
      .limit(1);

    if (!activity) {
      [activity] = await db
        .insert(activities)
        .values({
          title: title.trim(),
          description: description?.trim() || null,
          location: location?.trim() || null,
          uploader: uploader?.trim() || null,
        })
        .returning();
    } else {
      const changed: Record<string, string> = {};
      if (description?.trim() && !activity.description) changed.description = description.trim();
      if (location?.trim() && !activity.location) changed.location = location.trim();
      if (uploader?.trim() && !activity.uploader) changed.uploader = uploader.trim();
      if (Object.keys(changed).length > 0) {
        [activity] = await db
          .update(activities)
          .set(changed)
          .where(eq(activities.id, activity.id))
          .returning();
      }
    }

    const [photo] = await db
      .insert(photos)
      .values({
        activityId: activity.id,
        activityDate: activityDate,
        driveFileId,
        fileName: file.name,
        mimeType: file.type,
        size: fileSize,
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
    console.error("=== UPLOAD ERROR ===", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengunggah foto" },
      { status: 500 }
    );
  }
}