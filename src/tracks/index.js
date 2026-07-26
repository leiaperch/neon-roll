import { buildTrack, validateMap } from '../levelkit.js';
import house from './house.js';
import techno from './techno.js';
import trance from './trance.js';
import chiptune from './chiptune.js';
import bigroom from './bigroom.js';

/** Le disque, dans l'ordre de lecture : le tempo monte de piste en piste. */
export const TRACKS = [house, techno, trance, chiptune, bigroom].map(buildTrack);

export const trackById = (id) => TRACKS.find((t) => t.id === id) || TRACKS[0];

/** Contrôle de toutes les pistes, utilisé par le jeu et en ligne de commande. */
export function validateAll() {
  return TRACKS.map((track) => ({
    id: track.id,
    titre: track.title,
    lignes: track.totalRows,
    secondes: +((track.totalRows * 60) / (track.bpm * track.rowsPerBeat)).toFixed(1),
    erreurs: validateMap(track.rows, track.rowsPerBeat),
  }));
}
