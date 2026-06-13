import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Tes koneksi database saat startup
sql`SELECT 1`.then(() => console.log("Database OK")).catch((e) => console.error("Database Error:", e));