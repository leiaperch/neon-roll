const CLE = 'sillon.progression.v1';

/**
 * Progression locale, une entrée par piste. Rien n'est envoyé nulle part :
 * le stockage du navigateur suffit et le jeu reste jouable hors ligne.
 */
export class Save {
  constructor() {
    this.data = {};
    try {
      this.data = JSON.parse(localStorage.getItem(CLE)) || {};
    } catch {
      this.data = {};
    }
  }

  get(id) {
    return this.data[id] || { best: 0, crowns: 0, diamonds: 0, cleared: false };
  }

  /** Ne conserve que le meilleur résultat de chaque piste. */
  merge(id, resultat) {
    const actuel = this.get(id);
    this.data[id] = {
      best: Math.max(actuel.best, resultat.best || 0),
      crowns: Math.max(actuel.crowns, resultat.crowns || 0),
      diamonds: Math.max(actuel.diamonds, resultat.diamonds || 0),
      cleared: actuel.cleared || Boolean(resultat.cleared),
    };
    this._write();
  }

  _write() {
    try {
      localStorage.setItem(CLE, JSON.stringify(this.data));
    } catch {
      /* stockage indisponible, la partie reste jouable sans mémoire */
    }
  }
}
