import { dbClient } from "./src/db";

async function run() {
  try {
    const usersRes = await dbClient.execute({
      sql: `SELECT u.id, u.email, u.name, u.role, u.plan_id, u.created_at,
                   u.subscription_started_at, u.subscription_expires_at,
                   (SELECT slug FROM landing_pages lp WHERE lp.user_id = u.id ORDER BY lp.created_at DESC LIMIT 1) as slug 
            FROM users u
            ORDER BY u.created_at DESC`,
      args: []
    });
    console.log("SUCCESS:", usersRes.rows.length, "users found");
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}

run();
