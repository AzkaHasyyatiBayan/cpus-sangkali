import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, photos } from "@/lib/schema";
import { eq, and, desc, ilike, isNull } from "drizzle-orm";
import { isInsideBuildingActivity } from "@/lib/constants";

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

// Normalize title untuk deduplication
function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
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

    console.log(`[Activities API] Total rows from DB: ${results.length}`);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    // Gunakan Map dengan normalized title sebagai key untuk deduplication
    const activityMap = new Map<
      string, // normalized title sebagai key
      {
        id: number;
        title: string;
        description: string | null;
        location: string | null;
        uploader: string | null;
        category: string;
        groupsMap: Map<string, PhotoGroup>;
      }
    >();

    for (const row of results) {
      const act = row.activity;
      const photo = row.photo;

      const computedCategory = isInsideBuildingActivity(act.title) ? "inside" : "outside";

      // Filter category berdasarkan perhitungan
      if (category && category !== "all" && category !== "") {
        if (computedCategory !== category) {
          continue; // Skip activity ini karena tidak match category
        }
      }

      // Normalize title untuk deduplication
      const normalizedTitle = normalizeTitle(act.title);

      // Jika activity dengan title yang sama (case-insensitive) sudah ada, gabungkan photos-nya
      if (!activityMap.has(normalizedTitle)) {
        activityMap.set(normalizedTitle, {
          id: act.id,
          title: act.title,
          description: act.description,
          location: act.location,
          uploader: act.uploader,
          category: computedCategory,
          groupsMap: new Map(),
        });
      }

      if (photo) {
        const entry = activityMap.get(normalizedTitle)!;
        const groupKey = `${photo.activityDate}__${photo.location ?? ""}__${photo.uploader ?? ""}`;
        if (!entry.groupsMap.has(groupKey)) {
          entry.groupsMap.set(groupKey, {
            date: photo.activityDate,
            location: photo.location,
            uploader: photo.uploader,
            photos: [],
          });
        }
        
        // Cek apakah photo ini sudah ada (hindari duplikat photo)
        const existingPhotos = entry.groupsMap.get(groupKey)!.photos;
        const photoExists = existingPhotos.some(p => p.id === photo.id);
        
        if (!photoExists) {
          existingPhotos.push({
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

    // Logging untuk debug
    console.log(`[Activities API] Category filter: ${category || "none"}, Total activities: ${activityList.length}`);
    if (category && category !== "all" && category !== "") {
      console.log(`[Activities API] Activities:`, activityList.map(a => ({ title: a.title, category: a.category })));
    }

    return NextResponse.json({ success: true, data: activityList });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data";
    console.error("Fetch activities error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}