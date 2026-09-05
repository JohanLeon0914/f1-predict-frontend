import { NextRequest, NextResponse } from "next/server";

const ALLOWED_IMAGE_HOSTS = new Set(["media.formula1.com", "www.formula1.com"]);

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url");

  if (!source) {
    return new NextResponse("Missing image URL", { status: 400 });
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(source);
  } catch {
    return new NextResponse("Invalid image URL", { status: 400 });
  }

  if (imageUrl.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.has(imageUrl.hostname)) {
    return new NextResponse("Image host is not allowed", { status: 403 });
  }

  try {
    const response = await fetch(imageUrl, {
      cache: "no-store",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent": "F1MLPredicts/0.1.0",
      },
    });

    if (!response.ok || !response.body) {
      return new NextResponse("Driver image unavailable", {
        status: response.status || 502,
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": response.headers.get("content-type") ?? "image/png",
      },
    });
  } catch {
    return new NextResponse("Could not fetch driver image", {
      status: 502,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}
