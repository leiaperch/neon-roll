/**
 * Collecteur de captures : la page POSTe un canvas.toDataURL() ici, on écrit
 * le PNG sur disque. Sert uniquement à vérifier le rendu pendant le dev.
 *   node tools/capture-sink.mjs <dossier de sortie>
 */
import { createServer } from 'node:http';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.argv[2] || '.';
mkdirSync(outDir, { recursive: true });

createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.end();
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    try {
      const { name, data } = JSON.parse(body);
      const png = Buffer.from(data.split(',')[1], 'base64');
      const file = join(outDir, `${name}.png`);
      writeFileSync(file, png);
      console.log('écrit', file, png.length, 'octets');
      res.end('ok');
    } catch (err) {
      console.error(err.message);
      res.statusCode = 400;
      res.end('ko');
    }
  });
}).listen(5199, () => console.log('collecteur prêt sur http://localhost:5199'));
