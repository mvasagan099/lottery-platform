const { execSync } = require('child_process');

function resolveMigration(name) {
  try {
    console.log(`Resolving failed migration: ${name}...`);
    execSync(`npx prisma migrate resolve --rolled-back ${name}`, { stdio: 'inherit' });
    console.log(`Migration ${name} resolved successfully!`);
  } catch (e) {
    console.log(`Resolve command for ${name} failed, it may be already resolved.`);
  }
}

resolveMigration('20260717130000_sync_missing_tables');
resolveMigration('20260717130001_update_enum');
resolveMigration('20260717130002_sync_missing_tables');
