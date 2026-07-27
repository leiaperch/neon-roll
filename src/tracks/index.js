import { buildTrack, validateMap } from '../levelkit.js';
import beachhouse from './beachhouse.js';
import house from './house.js';
import techno from './techno.js';
import progressive from './progressive.js';
import atelier from './atelier.js';
import trance from './trance.js';
import futurebass from './futurebass.js';
import chiptune from './chiptune.js';
import hardstyle from './hardstyle.js';
import bigroom from './bigroom.js';
import roulement from './roulement.js';

/**
 * Le disque, dans l'ordre de lecture. Le tempo monte de piste en piste, et
 * comme le tempo pilote la vitesse de défilement, la difficulté monte avec.
 */
export const TRACKS = [
  beachhouse, house, techno, progressive, atelier, trance,
  futurebass, chiptune, hardstyle, bigroom, roulement,
].map(buildTrack);

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
