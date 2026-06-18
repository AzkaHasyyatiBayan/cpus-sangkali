import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, photos } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, BorderStyle, WidthType, PageBreak, VerticalAlign,
} from "docx";
import sizeOf from "image-size";
import { CLINIC_INFO } from "@/lib/clinicInfo";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

interface PhotoRow {
  id: number;
  driveFileId: string;
  fileName: string | null;
  activityDate: string;
  location: string | null;
  uploader: string | null;
}

const CONTENT_WIDTH_PX = 601;
const MAX_HEIGHT_PX = 760;
const TOTAL_CONTENT_DXA = 11906 - 1440 - 1440; // 9026 dxa

function formatTanggal(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function fetchImageBuffer(driveFileId: string): Promise<Buffer> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const url = `https://res.cloudinary.com/${cloudName}/image/upload/w_1600,q_auto,f_jpg/${driveFileId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal mengambil foto ${driveFileId}`);
  return Buffer.from(await res.arrayBuffer());
}

function arialText(text: string, sizeHalfPt: number, font: string = "Arial") {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, size: sizeHalfPt, font })],
  });
}

function serifText(text: string, sizeHalfPt: number) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, size: sizeHalfPt, font: "Times New Roman" })],
  });
}

function buildKopHeader(logoBuffer: Buffer) {
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  return new Table({
    width: { size: TOTAL_CONTENT_DXA, type: WidthType.DXA },
    columnWidths: [1200, TOTAL_CONTENT_DXA - 1200],
    rows: [
      new TableRow({
        children: [
          // ✅ Logo: margin kiri & kanan dihapus agar menempel di tepi kiri garis kop
          new TableCell({
            width: { size: 1200, type: WidthType.DXA },
            borders: noBorders,
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 0 },
                indent: { left: 0, hanging: 0 },
                children: [
                  new ImageRun({
                    data: logoBuffer,
                    transformation: { width: 120, height: 132 },
                    type: "png",
                  }),
                ],
              }),
            ],
          }),
          // Kolom teks — CENTER penuh
          new TableCell({
            width: { size: TOTAL_CONTENT_DXA - 1200, type: WidthType.DXA },
            borders: noBorders,
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [
              arialText(CLINIC_INFO.pemerintah, 28),
              arialText(CLINIC_INFO.namaUnit, 36, "Arial Black"),
              arialText(CLINIC_INFO.alamat, 24),
              arialText(CLINIC_INFO.email, 24),
              arialText(CLINIC_INFO.kota, 24),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildKodePosRow() {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 40, after: 80 },
    children: [new TextRun({ text: CLINIC_INFO.kodePos, size: 24, font: "Arial" })],
  });
}

function buildDivider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 30, color: "000000", space: 1 } },
    spacing: { before: 0, after: 200 },
    children: [],
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = Number(id);
    if (!activityId) {
      return NextResponse.json({ error: "ID kegiatan tidak valid" }, { status: 400 });
    }

    const [activity] = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    if (!activity) {
      return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });
    }

    const photoRows: PhotoRow[] = await db
      .select({
        id: photos.id,
        driveFileId: photos.driveFileId,
        fileName: photos.fileName,
        activityDate: photos.activityDate,
        location: photos.location,
        uploader: photos.uploader,
      })
      .from(photos)
      .where(eq(photos.activityId, activityId))
      .orderBy(photos.activityDate, photos.createdAt);

    if (photoRows.length === 0) {
      return NextResponse.json({ error: "Kegiatan ini belum memiliki foto" }, { status: 400 });
    }

    const logoPath = path.join(process.cwd(), "public", "images", "logo-tasikmalaya.png");
    const logoBuffer = fs.readFileSync(logoPath);

    const children: (Paragraph | Table)[] = [];

    for (let i = 0; i < photoRows.length; i++) {
      const photo = photoRows[i];

      children.push(buildKopHeader(logoBuffer));
      children.push(buildKodePosRow());
      children.push(buildDivider());

      const titleLine = photo.location ? `${activity.title}, ${photo.location}` : activity.title;
      children.push(serifText("Dokumentasi Kegiatan", 28));
      children.push(serifText(titleLine, 28));
      children.push(serifText(`Tanggal ${formatTanggal(photo.activityDate)}`, 28));
      if (photo.uploader) {
        children.push(serifText(`Diunggah oleh: ${photo.uploader}`, 28));
      }
      children.push(new Paragraph({ text: "" }));

      const imgBuffer = await fetchImageBuffer(photo.driveFileId);
      const dimensions = sizeOf(imgBuffer);
      const ratio = (dimensions.height || 1200) / (dimensions.width || 1600);

      let widthPx = CONTENT_WIDTH_PX;
      let heightPx = Math.round(widthPx * ratio);
      if (heightPx > MAX_HEIGHT_PX) {
        heightPx = MAX_HEIGHT_PX;
        widthPx = Math.round(heightPx / ratio);
      }

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: imgBuffer,
              transformation: { width: widthPx, height: heightPx },
              type: "jpg",
            }),
          ],
        })
      );

      if (i < photoRows.length - 1) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }
    }

    const doc = new Document({
      styles: { default: { document: { run: { font: "Arial", size: 24 } } } },
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 567, right: 1440, bottom: 567, left: 1440 },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const fileName = `Dokumentasi_${activity.title.replace(/[^a-zA-Z0-9]/g, "_")}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: unknown) {
    console.error("Export error:", error);
    const message = error instanceof Error ? error.message : "Gagal membuat dokumen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}