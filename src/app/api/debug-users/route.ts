import { NextResponse } from "next/server";
import { dbClient } from "@/db";

// Temporary diagnostic endpoint — test users query directly
export async function GET() {
  try {
    // Test 1: Simple count
    const countRes = await dbClient.execute({
      sql: "SELECT COUNT(*) as cnt FROM users",
      args: []
    });

    // Test 2: List all users
    const usersRes = await dbClient.execute({
      sql: "SELECT id, email, name, role, plan_id, created_at FROM users ORDER BY created_at DESC",
      args: []
    });

    // Test 3: Test the subquery for slug
    let slugTest = "not tested";
    try {
      const slugRes = await dbClient.execute({
        sql: `SELECT u.id, u.email,
              (SELECT slug FROM landing_pages lp WHERE lp.user_id = u.id LIMIT 1) as slug
              FROM users u`,
        args: []
      });
      slugTest = JSON.stringify(slugRes.rows);
    } catch (e: any) {
      slugTest = `ERROR: ${e?.message}`;
    }

    // Test 4: Check landing_pages table
    const lpRes = await dbClient.execute({
      sql: "SELECT COUNT(*) as cnt FROM landing_pages",
      args: []
    });

    // Test 5: Check payments table
    let paymentsCount = "not tested";
    try {
      const pRes = await dbClient.execute({
        sql: "SELECT COUNT(*) as cnt FROM payments",
        args: []
      });
      paymentsCount = String(pRes.rows[0]?.cnt);
    } catch (e: any) {
      paymentsCount = `ERROR: ${e?.message}`;
    }

    return NextResponse.json({
      user_count: countRes.rows[0]?.cnt,
      users: usersRes.rows,
      slug_test: slugTest,
      landing_pages_count: lpRes.rows[0]?.cnt,
      payments_count: paymentsCount,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || "Unknown error",
      stack: error?.stack?.substring(0, 500)
    }, { status: 500 });
  }
}
