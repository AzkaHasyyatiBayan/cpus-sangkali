import { NextResponse } from "next/server";
import { getCloudinaryUsage } from "@/lib/storage";

export async function GET() {
  try {
    const usage = await getCloudinaryUsage();
    return NextResponse.json({ success: true, data: usage });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengambil usage";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}