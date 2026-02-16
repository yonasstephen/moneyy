import { NextResponse } from "next/server";
import { syncData } from "@/lib/data/store";

export async function POST() {
  try {
    const result = await syncData();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
