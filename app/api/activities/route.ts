import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, photos } from "@/lib/schema";
import { eq, and, desc, like } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title");
    const date = searchParams.get("date");

    const conditions = [];
    if (title) conditions.push(like(activities.title, `%${title}%`));
    if (date) conditions.push(eq(activities.activityDate, date));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        activity: activities,
        photo: photos,
      })
      .from(activities)
      .leftJoin(photos, eq(activities.id, photos.activityId))
      .where(whereClause)
      .orderBy(desc(activities.activityDate), desc(photos.createdAt));

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    const groupedActivities: Record<
      number,
      {
        id: number;
        title: string;
        activityDate: string;
        createdAt: Date;
        photos: {
          id: number;
          driveFileId: string;
          fileName: string | null;
          mimeType: string | null;
          thumbnailUrl: string;
          fullUrl: string;
        }[];
      }
    > = {};

    results.forEach((row) => {
      const actId = row.activity.id;
      if (!groupedActivities[actId]) {
        groupedActivities[actId] = {
          ...row.activity,
          photos: [],
        };
      }
      if (row.photo) {
        groupedActivities[actId].photos.push({
          ...row.photo,
          thumbnailUrl: `https://res.cloudinary.com/${cloudName}/image/upload/w_400,c_fill/${row.photo.driveFileId}`,
          fullUrl: `https://res.cloudinary.com/${cloudName}/image/upload/${row.photo.driveFileId}`,
        });
      }
    });

    const activityList = Object.values(groupedActivities).sort(
      (a, b) =>
        new Date(b.activityDate).getTime() -
        new Date(a.activityDate).getTime()
    );

    return NextResponse.json({
      success: true,
      data: activityList,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal mengambil data";
    console.error("Fetch activities error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}