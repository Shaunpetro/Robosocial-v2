// scripts/check-neon.js
const { PrismaClient } = require('@prisma/client');

const neonUrl = process.argv[2];
if (!neonUrl) {
  console.error('Usage: node scripts/check-neon.js <neon-database-url>');
  process.exit(1);
}

process.env.DATABASE_URL = neonUrl;
const prisma = new PrismaClient();

async function main() {
  try {
    // List all tables in public schema
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('Tables found:');
    for (const t of tables) {
      console.log(` - ${t.table_name}`);
    }

    // Count rows in each table
    console.log('\nRow counts:');
    for (const t of tables) {
      const tableName = t.table_name;
      // Use quoted identifiers to avoid reserved words
      const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS count FROM "${tableName}";`);
      console.log(` - ${tableName}: ${result[0].count}`);
    }
  } catch (error) {
    console.error('Failed to connect or query Neon:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();