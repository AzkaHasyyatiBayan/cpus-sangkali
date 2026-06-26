import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, photos } from "@/lib/schema";
import { eq, and, desc, ilike, isNull } from "drizzle-orm";

interface PhotoItem {
  id: number;
  driveFileId: string;
  fileName: string | null;
  mimeType: string | null;
  activityDate: string;
  thumbnailUrl: string;
  fullUrl: string;
}

interface PhotoGroup {
  date: string;
  location: string | null;
  uploader: string | null;
  photos: PhotoItem[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const title = searchParams.get("title");
    const date = searchParams.get("date");
    const location = searchParams.get("location");
    const uploader = searchParams.get("uploader");
    const category = searchParams.get("category"); 
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const conditions = [];
    if (id) conditions.push(eq(activities.id, Number(id)));
    if (title) conditions.push(ilike(activities.title, `%${title}%`));
    if (date) conditions.push(eq(photos.activityDate, date));
    if (location) conditions.push(ilike(photos.location, `%${location}%`));
    if (uploader) conditions.push(ilike(photos.uploader, `%${uploader}%`));
    if (category) conditions.push(eq(activities.category, category));
    // Filter foto yang belum dihapus (kecuali includeDeleted=true untuk halaman trash)
    if (!includeDeleted) {
      conditions.push(isNull(photos.deletedAt));
    }

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
        location: string | null;
        uploader: string | null;
        category: string | null;
        groupsMap: Map<string, PhotoGroup>;
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
          category: act.category,
          groupsMap: new Map(),
        });
      }

      if (photo) {
        const entry = activityMap.get(act.id)!;
        const groupKey = `${photo.activityDate}__${photo.location ?? ""}__${photo.uploader ?? ""}`;
        if (!entry.groupsMap.has(groupKey)) {
          entry.groupsMap.set(groupKey, {
            date: photo.activityDate,
            location: photo.location,
            uploader: photo.uploader,
            photos: [],
          });
        }
        entry.groupsMap.get(groupKey)!.photos.push({
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
        category: act.category,
        dates: Array.from(act.groupsMap.values()).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
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