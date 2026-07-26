import { validate, TOTAL_ROWS, checkpointRows } from '../src/level.js';

const errors = validate();
if (errors.length) {
  console.error(`Niveau invalide (${errors.length} problème(s)) :`);
  for (const e of errors) console.error('  -', e);
  process.exit(1);
}
console.log(`Niveau valide : ${TOTAL_ROWS} lignes, checkpoints aux lignes ${checkpointRows().join(', ')}.`);
