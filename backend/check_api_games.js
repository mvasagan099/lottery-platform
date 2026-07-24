const http = require('http');

http.get('http://localhost:3001/games', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log("All Games:");
      console.log(parsed.data.map(g => ({ name: g.name, slug: g.slug, nextDraw: g.nextDraw })));
    } catch (e) {
      console.log("Error parsing:", e.message);
      console.log("Raw response:", data);
    }
  });
}).on('error', console.error);
