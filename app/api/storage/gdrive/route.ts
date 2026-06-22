import { NextResponse } from "next/server";
import { getGoogleDriveStorage } from "@/lib/googleDrive";

export async function GET() {
  try {
    const storage = await getGoogleDriveStorage();
    if (!storage) {
      return NextResponse.json({ success: false, error: "Tidak bisa mengakses GDrive" });
    }
    return NextResponse.json({ success: true, data: storage });
  } catch {
    return NextResponse.json({ success: false, error: "Gagal cek storage GDrive" });
  }
}