import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "https://da7c23add0ce839e4989c068fbfa4394.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "e169e25b648cc1ddc6482d84366df9c2",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "e5005d9395444fdb05a3d2f2d04cb910165dd17272e4fffbfb21a27148061a93",
  },
});

const R2_BUCKET = process.env.R2_BUCKET || "landingpages";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-1cd771ae4e244160bc1b835e2b157ad6.r2.dev";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileType = formData.get("type") as string || "avatar"; // "avatar" | "video" | "background"

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    const mimeType = file.type;
    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Formato no soportado. Debe ser imagen (.png, .jpg, .webp) o video (.mp4, .webm)." },
        { status: 400 }
      );
    }

    // Size limit check: 5MB for images, 10MB for videos
    const maxSizeBytes = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `El archivo excede el tamaño máximo permitido (${isVideo ? "10MB" : "5MB"}).` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "png");
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const key = `${fileType}s/${session.user.id}_${uniqueId}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await r2Client.send(command);

    const publicUrl = `${R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key,
      size: file.size,
      mimeType,
    });
  } catch (error: any) {
    console.error("Cloudflare R2 Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Error al subir el archivo a Cloudflare R2" },
      { status: 500 }
    );
  }
}
