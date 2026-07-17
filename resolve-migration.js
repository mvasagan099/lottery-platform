const { execSync } = require('child_process');
try {
  console.log('Resolving failed migration...');
  execSync('npx prisma migrate resolve --rolled-back 20260717130000_sync_missing_tables', { stdio: 'inherit' });
  console.log('Migration resolved successfully!');
} catch (e) {
  console.log('Resolve command failed, continuing anyway...');
}
