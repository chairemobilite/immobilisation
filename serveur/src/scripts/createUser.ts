import { auth } from "../lib/auth";
import { pool } from '../lib/poolCreate';
// Database connection

async function createFirstUser() {
    // Parse arguments: node script.js --email="test@example.com" --password="securePass"
    const args = process.argv.slice(2);
    const emailArg = args.find(a => a.startsWith('--email='));
    const passArg = args.find(a => a.startsWith('--password='));
    const nameArg = args.find(a => a.startsWith('--name='));

    if (!emailArg || !passArg) {
        console.error("Usage: node script.js --email=user@test.com --password=securePass [--name='User Name']");
        process.exit(1);
    }

    const email = emailArg.split('=')[1];
    const password = passArg.split('=')[1];
    const name = nameArg ? nameArg.split('=')[1] : "New User";

    console.log("🔐 Creating user via CLI arguments...");
    try {
        const res = await auth.api.signUpEmail({
            body: {
                email: email,
                password: password,
                name: name
            }
        });
        console.log("✅ Success:", res);
    } catch (error) {
        console.error("❌ Failed:", error);
        process.exit(1);
    } finally {
        await pool.end()
    }
}

if (require.main === module) {
  createFirstUser();
}
