import { NextResponse } from "next/server";
import crypto from "crypto";
import { checkAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const authResponse = checkAuth(req);
  if (authResponse) return authResponse;

  try {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files found in request" }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary configuration is missing on the server" },
        { status: 500 }
      );
    }

    // Helper to upload a single file
    const uploadSingle = async (file: File): Promise<string> => {
      const timestamp = Math.round(Date.now() / 1000).toString();
      
      // Calculate signature: SHA-1 of sorted query string parameters + apiSecret
      const stringToSign = `timestamp=${timestamp}${apiSecret}`;
      const signature = crypto
        .createHash("sha1")
        .update(stringToSign)
        .digest("hex");

      const targetFormData = new FormData();
      targetFormData.append("file", file);
      targetFormData.append("api_key", apiKey);
      targetFormData.append("timestamp", timestamp);
      targetFormData.append("signature", signature);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: targetFormData,
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Cloudinary upload failed");
      }

      const data = await res.json();
      return data.secure_url;
    };

    // Upload all files concurrently
    const urls = await Promise.all(files.map((file) => uploadSingle(file)));

    return NextResponse.json({ urls });
  } catch (error: any) {
    console.error("POST /api/journal/upload failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload files" },
      { status: 500 }
    );
  }
}
