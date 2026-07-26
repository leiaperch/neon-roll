import { validateAll } from '../src/tracks/index.js';

const report = validateAll();
let fautes = 0;

for (const piste of report) {
  if (piste.erreurs.length) {
    fautes += piste.erreurs.length;
    console.error(`✗ ${piste.id} — ${piste.titre} (${piste.lignes} lignes)`);
    for (const e of piste.erreurs) console.error('   ', e);
  } else {
    console.log(`✓ ${piste.id} — ${piste.titre} : ${piste.lignes} lignes, ${piste.secondes} s`);
  }
}

if (fautes) {
  console.error(`\n${fautes} problème(s).`);
  process.exit(1);
}
console.log(`\n${report.length} pistes valides.`);
