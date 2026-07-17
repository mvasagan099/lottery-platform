const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://lottery_user:secure_password@127.0.0.1:5434/lottery_db?schema=public' });
  await client.connect();
  try {
    await client.query('CREATE DATABASE lottery_db_shadow');
    console.log('Shadow DB created');
  } catch (e) {
    if (e.code === '42P04') {
        console.log('Shadow DB already exists');
    } else {
        console.error(e);
    }
  }
  await client.end();
}
run();
