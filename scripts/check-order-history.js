const { Pool } = require("pg");
const DATABASE_URL = "postgresql://neondb_owner:npg_lP5dOLiQoAv7@ep-lingering-voice-apv6dy88-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString: DATABASE_URL });
pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'order_status_history' ORDER BY ordinal_position")
  .then(r => { console.log(r.rows.map(x => `${x.column_name} (${x.data_type}) nullable:${x.is_nullable}`).join("\n")); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
