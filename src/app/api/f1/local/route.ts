import { NextResponse } from "next/server";
import {
  getLocalF1DataServer,
} from "@/lib/local-f1-data-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getLocalF1DataServer();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
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
