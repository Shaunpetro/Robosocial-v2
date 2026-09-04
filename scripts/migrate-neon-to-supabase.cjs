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

function formatValue(val) {
  if (val === null || val === undefined) return null;
  if (Array.isArray(val)) {
    // Let pg handle arrays natively
    return val;
  }
  if (typeof val === 'object') {
    // Convert objects (json/jsonb) to JSON string
    return JSON.stringify(val);
  }
  return val;
}

async function migrate() {
  const neon = new Client({
    connectionString: neonUrl,
    ssl: { rejectUnauthorized: false },
  });
  const supabase = new Client({
    connectionString: supabaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await neon.connect();
  await supabase.connect();
  console.log('Connected to both databases.\n');

  for (const table of tables) {
    console.log(`\n=== Migrating ${table} ===`);
    const { rows } = await neon.query(`SELECT * FROM "${table}"`);
    console.log(`Found ${rows.length} rows in Neon.`);
    if (rows.length === 0) continue;

    const columns = Object.keys(rows[0]);
    const insertCols = columns.map((c) => `"${c}"`).join(', ');
    const valuePlaceholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const updateCols = columns
      .filter((c) => c !== 'id')
      .map((c) => `"${c}" = EXCLUDED."${c}"`)
      .join(', ');

    const upsertSQL = `
      INSERT INTO "${table}" (${insertCols})
      VALUES (${valuePlaceholders})
      ON CONFLICT ("id") DO UPDATE SET ${updateCols};
    `;

    for (const row of rows) {
      const values = columns.map((c) => formatValue(row[c]));
      try {
        await supabase.query(upsertSQL, values);
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