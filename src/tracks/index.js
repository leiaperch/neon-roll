import { buildTrack, validateMap } from '../levelkit.js';
import blues from './blues.js';
import baroque from './baroque.js';
import chiptune from './chiptune.js';
import techno from './techno.js';
import metal from './metal.js';

/** Le disque, dans l'ordre de lecture. */
export const TRACKS = [blues, baroque, chiptune, techno, metal].map(buildTrack);

export const trackById = (id) => TRACKS.find((t) => t.id === id) || TRACKS[0];

/** Contrôle de toutes les pistes, utilisé par le jeu et en ligne de commande. */
export function validateAll() {
  const report = [];
  for (const track of TRACKS) {
    report.push({
      id: track.id,
      titre: track.title,
      lignes: track.totalRows,
      secondes: +((track.totalRows * 60) / (track.bpm * track.rowsPerBeat)).toFixed(1),
      erreurs: validateMap(track.rows, track.rowsPerBeat),
    });
  }
  return report;
}
