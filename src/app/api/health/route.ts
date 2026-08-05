import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "anchor-care",
    timestamp: new Date().toISOString(),
  });
}
