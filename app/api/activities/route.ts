import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, photos } from "@/lib/schema";
import { eq, and, desc, like } from "drizzle-orm";

interface PhotoItem {
  id: number;
  driveFileId: string;
  fileName: string | null;
  mimeType: string | null;
  activityDate: string;
  thumbnailUrl: string;
  fullUrl: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title");
    const date = searchParams.get("date");
    const location = searchParams.get("location");
    const uploader = searchParams.get("uploader");

    const conditions = [];
    if (title) conditions.push(like(activities.title, `%${title}%`));
    if (date) conditions.push(eq(photos.activityDate, date));
    if (location) conditions.push(like(activities.location, `%${location}%`));
    if (uploader) conditions.push(like(activities.uploader, `%${uploader}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        activity: activities,
        photo: photos,
      })
      .from(activities)
      .leftJoin(photos, eq(activities.id, photos.activityId))
      .where(whereClause)
      .orderBy(desc(activities.createdAt), desc(photos.activityDate), desc(photos.createdAt));

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    const activityMap = new Map<
      number,
      {
        id: number;
        title: string;
        description: string | null;
        location: string | null;       // ⬅️ baru
        uploader: string | null;       // ⬅️ baru
        datesMap: Map<string, PhotoItem[]>;
      }
    >();

    for (const row of results) {
      const act = row.activity;
      const photo = row.photo;

      if (!activityMap.has(act.id)) {
        activityMap.set(act.id, {
          id: act.id,
          title: act.title,
          description: act.description,
          location: act.location,
          uploader: act.uploader,
          datesMap: new Map(),
        });
      }

      if (photo) {
        const entry = activityMap.get(act.id)!;
        const dateKey = photo.activityDate;
        if (!entry.datesMap.has(dateKey)) {
          entry.datesMap.set(dateKey, []);
        }
        entry.datesMap.get(dateKey)!.push({
          id: photo.id,
          driveFileId: photo.driveFileId,
          fileName: photo.fileName,
          mimeType: photo.mimeType,
          activityDate: photo.activityDate,
          thumbnailUrl: `https://res.cloudinary.com/${cloudName}/image/upload/w_400,c_fill/${photo.driveFileId}`,
          fullUrl: `https://res.cloudinary.com/${cloudName}/image/upload/${photo.driveFileId}`,
        });
      }
    }

    const activityList = Array.from(activityMap.values())
      .map((act) => ({
        id: act.id,
        title: act.title,
        description: act.description,
        location: act.location,
        uploader: act.uploader,
        dates: Array.from(act.datesMap.entries())
          .map(([date, photos]) => ({ date, photos }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }))
      .sort((a, b) => {
        const aDate = a.dates[0]?.date || "";
        const bDate = b.dates[0]?.date || "";
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

    return NextResponse.json({ success: true, data: activityList });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data";
    console.error("Fetch activities error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}