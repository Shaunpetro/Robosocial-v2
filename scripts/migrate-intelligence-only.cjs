// scripts/migrate-intelligence-only.cjs
const { Client } = require('pg');

const neonUrl = process.argv[2];
const supabaseUrl = process.argv[3];

if (!neonUrl || !supabaseUrl) {
  console.error('Usage: node scripts/migrate-intelligence-only.cjs <neon-url> <supabase-url>');
  process.exit(1);
}

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

  // Migrate CompanyIntelligence
  console.log('=== Migrating CompanyIntelligence ===');
  const intelRows = (await neon.query(`SELECT * FROM "CompanyIntelligence"`)).rows;
  const intelColTypes = await getColumnTypes(neon, 'CompanyIntelligence');
  console.log(`Found ${intelRows.length} rows.`);

  for (const row of intelRows) {
    const columns = Object.keys(row);
    const values = columns.map((col, index) => {
      const type = intelColTypes[col];
      const val = row[col];
      if (val === null || val === undefined) return null;
      // For JSON/JSONB columns, stringify the object/array
      if (type === 'json' || type === 'jsonb') {
        return JSON.stringify(val);
      }
      // For other types, return as is (driver handles arrays)
      return val;
    });

    const insertCols = columns.map(c => `"${c}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO "CompanyIntelligence" (${insertCols}) VALUES (${placeholders}) ON CONFLICT ("id") DO UPDATE SET ${columns.filter(c => c !== 'id').map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')}`;

    try {
      await supabase.query(sql, values);
      console.log(`Inserted intelligence id ${row.id}`);
    } catch (err) {
      console.error(`Error inserting intelligence id ${row.id}:`, err.message);
    }
  }

  // Migrate ContentPillar
  console.log('\n=== Migrating ContentPillar ===');
  const pillarRows = (await neon.query(`SELECT * FROM "ContentPillar"`)).rows;
  const pillarColTypes = await getColumnTypes(neon, 'ContentPillar');
  console.log(`Found ${pillarRows.length} rows.`);

  for (const row of pillarRows) {
    const columns = Object.keys(row);
    const values = columns.map((col, index) => {
      const type = pillarColTypes[col];
      const val = row[col];
      if (val === null || val === undefined) return null;
      if (type === 'json' || type === 'jsonb') {
        return JSON.stringify(val);
      }
      return val;
    });

    const insertCols = columns.map(c => `"${c}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO "ContentPillar" (${insertCols}) VALUES (${placeholders}) ON CONFLICT ("id") DO UPDATE SET ${columns.filter(c => c !== 'id').map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')}`;

    try {
      await supabase.query(sql, values);
      console.log(`Inserted pillar id ${row.id}`);
    } catch (err) {
      console.error(`Error inserting pillar id ${row.id}:`, err.message);
    }
  }

  await neon.end();
  await supabase.end();
  console.log('\nMigration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});