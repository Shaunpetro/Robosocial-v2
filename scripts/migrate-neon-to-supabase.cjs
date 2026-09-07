// scripts/migrate-neon-to-supabase.cjs
const { Client } = require('pg');

const neonUrl = process.argv[2];
const supabaseUrl = process.argv[3];

if (!neonUrl || !supabaseUrl) {
  console.error('Usage: node scripts/migrate-neon-to-supabase.cjs <neon-url> <supabase-url>');
  process.exit(1);
}

const tables = [
  'Company',
  'Platform',
  'Media',
  'CompanyIntelligence',
  'ContentPillar',
  'GeneratedPost',
  'CompanySpecialDatesConfig',
];

async function getColumnTypes(client, table) {
  const res = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`,
    [table]
  );
  const map = {};
  for (const row of res.rows) {
    map[row.column_name] = row.data_type;
  }
  return map;
}

async function migrate() {
  const neon = new Client({ connectionString: neonUrl, ssl: { rejectUnauthorized: false } });
  const supabase = new Client({ connectionString: supabaseUrl, ssl: { rejectUnauthorized: false } });

  await neon.connect();
  await supabase.connect();
  console.log('Connected to both databases.\n');

  for (const table of tables) {
    console.log(`\n=== Migrating ${table} ===`);
    const { rows } = await neon.query(`SELECT * FROM "${table}"`);
    console.log(`Found ${rows.length} rows.`);
    if (rows.length === 0) continue;

    const columnTypes = await getColumnTypes(neon, table);

    for (const row of rows) {
      const columns = Object.keys(row);
      const values = columns.map(col => {
        const val = row[col];
        const type = columnTypes[col];
        if (val === null || val === undefined) return null;
        if (type === 'json' || type === 'jsonb') {
          // Let pg serialize JS object/array to JSON
          return val;
        }
        if (type === 'ARRAY' || type.endsWith('[]')) {
          // Let pg serialize JS array to PostgreSQL array
          return val;
        }
        // For other types, return as is
        return val;
      });

      const insertCols = columns.map(c => `"${c}"`).join(', ');
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const updateCols = columns.filter(c => c !== 'id').map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');
      const sql = `INSERT INTO "${table}" (${insertCols}) VALUES (${placeholders}) ON CONFLICT ("id") DO UPDATE SET ${updateCols}`;

      try {
        await supabase.query(sql, values);
        process.stdout.write('.');
      } catch (err) {
        console.error(`\nError inserting ${table} id=${row.id}:`, err.message);
      }
    }
    console.log(`\nDone migrating ${table}`);
  }

  await neon.end();
  await supabase.end();
  console.log('\n\nMigration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});