import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "dokumentasi-kegiatan",
        public_id: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, "_")}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload gagal"));
        resolve(result.public_id);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

export async function getCloudinaryUsage(): Promise<{
  used: number;
  limit: number;
  percent: number;
}> {
  const result = await cloudinary.api.usage();
  const usedBytes = result.storage.usage;
  const limitBytes = 25 * 1024 * 1024 * 1024; // 25 GB
  return {
    used: usedBytes,
    limit: limitBytes,
    percent: (usedBytes / limitBytes) * 100,
  };
}

export function getThumbnailUrl(fileId: string, size: number = 400): string {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_${size},c_fill/${fileId}`;
}

export function getFullImageUrl(fileId: string): string {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${fileId}`;
}