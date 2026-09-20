import { NextResponse } from "next/server";

// Temporary debug endpoint — REMOVE IN PRODUCTION
export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "✅ SET" : "❌ MISSING",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? `✅ SET (length: ${process.env.NEXTAUTH_SECRET.length})` : "❌ MISSING",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `✅ SET (starts: ${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...)` : "❌ MISSING",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? `✅ SET (starts: ${process.env.GOOGLE_CLIENT_SECRET.substring(0, 8)}...)` : "❌ MISSING",
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? "✅ SET" : "❌ MISSING",
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? `✅ SET (length: ${process.env.TURSO_AUTH_TOKEN.length})` : "❌ MISSING",
      NODE_ENV: process.env.NODE_ENV || "unknown",
      VERCEL_URL: process.env.VERCEL_URL || "not set",
      VERCEL_ENV: process.env.VERCEL_ENV || "not set",
    },
    nextauth_url_value: process.env.NEXTAUTH_URL || "NOT SET",
    turso_test: "pending",
  };

  // Test Turso connection
  try {
    const { dbClient } = await import("@/db");
    const result = await dbClient.execute({ sql: "SELECT COUNT(*) as count FROM users", args: [] });
    diagnostics.turso_test = `✅ Connected (${result.rows[0]?.count} users)`;
  } catch (e: any) {
    diagnostics.turso_test = `❌ Error: ${e?.message || String(e)}`;
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
