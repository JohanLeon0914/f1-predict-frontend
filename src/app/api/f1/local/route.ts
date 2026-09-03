import { NextResponse } from "next/server";
import {
  getCachedLocalF1Data,
  LOCAL_F1_DATA_REVALIDATE_SECONDS,
} from "@/lib/local-f1-data-server";

export async function GET() {
  try {
    const data = await getCachedLocalF1Data();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${LOCAL_F1_DATA_REVALIDATE_SECONDS}, stale-while-revalidate=3600`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? error.message
            : "No se pudieron leer los CSV locales.",
      },
      { status: 500 },
    );
  }
}
