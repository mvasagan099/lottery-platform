const fs = require('fs');
const lines = fs.readFileSync('migration_backup.sql', 'utf8').split('\n');

const enumMigration = lines.filter(l => l.startsWith('ALTER TYPE')).join('\n');
fs.writeFileSync('prisma/migrations/20260717130001_update_enum/migration.sql', enumMigration);

const tablesMigration = lines.filter(l => !l.startsWith('ALTER TYPE')).join('\n');
fs.writeFileSync('prisma/migrations/20260717130002_sync_missing_tables/migration.sql', tablesMigration);
