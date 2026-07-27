import * as THREE from 'three';
import {
  COLS, TILE, TRACK_HALF, BALL_RADIUS, BLOCK_SIZE, BLOCK_HEIGHT,
  rowDuration, trackSpeed, cameraDistance,
} from './config.js';
import {
  VOID, BLOCK, DIAMOND, CROWN, JUMP, CHECKPOINT, SWEEPER, SLIDER,
  LASER, RISER, BELT_R, BELT_L, PLATFORM, MARTEAU, PRESSE, ROUE, SPINNER,
  laserBank, riserUp, presseBasse, sensBalayage,
} from './levelkit.js';

const SWEEPER_PERIOD_BEATS = 6;
const SLIDER_PERIOD_BEATS = 6;
const PLATFORM_PERIOD_BEATS = 5;
const PLATFORM_HALF = TILE * 1.5; // trois colonnes de large
const PLATFORM_AMPLITUDE = TILE; // une colonne de débattement
const LASER_HALF = TILE * 1.5;
const LASER_CENTER = TILE * 2; // centre des colonnes 0-2 et 4-6
const SPINNER_LONGUEUR = 5.5; // demi-envergure de la barre
/**
 * Le spinner tourne lentement, et c'est indispensable.
 *
 * La bille reste environ une demi-ligne dans la zone de collision. Si la barre
 * tourne vite, son emprise change beaucoup pendant ce passage : elle peut être
 * dégagée à l'instant précis de l'arrivée et barrer la voie une fraction de
 * seconde plus tôt. Raisonner sur le seul instant d'arrivée, comme pour les
 * obstacles qui translatent, devient alors faux.
 */
const SPINNER_PERIOD_BEATS = 10;
/**
 * Angle au moment du passage : la barre est alignée sur la piste, donc son
 * emprise latérale se réduit au moyeu. Seule la colonne centrale est barrée,
 * les deux voisines restent libres, et un refuge est toujours à une colonne.
 */
const SPINNER_ANGLE_PASSAGE = Math.PI / 2;

export const colX = (col) => (col - (COLS - 1) / 2) * TILE;

/** Accumulateur de triangles : un seul maillage par matériau. */
class Builder {
  constructor() {
    this.pos = [];
    this.nor = [];
    this.col = [];
  }

  get empty() {
    return this.pos.length === 0;
  }

  box(cx, cy, cz, sx, sy, sz, color, shade = { top: 1, side: 0.74, bottom: 0.45 }) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const v = [
      [cx - hx, cy - hy, cz - hz], [cx + hx, cy - hy, cz - hz],
      [cx + hx, cy + hy, cz - hz], [cx - hx, cy + hy, cz - hz],
      [cx - hx, cy - hy, cz + hz], [cx + hx, cy - hy, cz + hz],
      [cx + hx, cy + hy, cz + hz], [cx - hx, cy + hy, cz + hz],
    ];
    const faces = [
      [[4, 5, 6], [4, 6, 7], [0, 0, 1], shade.side],
      [[1, 0, 3], [1, 3, 2], [0, 0, -1], shade.side],
      [[5, 1, 2], [5, 2, 6], [1, 0, 0], shade.side],
      [[0, 4, 7], [0, 7, 3], [-1, 0, 0], shade.side],
      [[3, 7, 6], [3, 6, 2], [0, 1, 0], shade.top],
      [[4, 0, 1], [4, 1, 5], [0, -1, 0], shade.bottom],
    ];
    const c = new THREE.Color(color);
    for (const [t1, t2, n, mul] of faces) {
      for (const tri of [t1, t2]) {
        for (const idx of tri) {
          this.pos.push(v[idx][0], v[idx][1], v[idx][2]);
          this.nor.push(n[0], n[1], n[2]);
          this.col.push(c.r * mul, c.g * mul, c.b * mul);
        }
      }
    }
  }

  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    return g;
  }
}

function skyTexture(top, bottom) {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 128;
  const ctx = c.getContext('2d');
  const hex = (v) => `#${v.toString(16).padStart(6, '0')}`;
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, hex(top));
  grad.addColorStop(0.62, hex(bottom));
  grad.addColorStop(1, hex(top));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 8, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function starfield(color) {
  const count = 500;
  const pos = new Float32Array(count * 3);
  let seed = 7919;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 150 + rnd() * 90;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = 25 + rnd() * 130;
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    color, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.6, fog: false,
  });
  const points = new THREE.Points(g, m);
  points.frustumCulled = false;
  return points;
}

/** Petite couronne en volume, réutilisée par toutes les instances. */
function crownGeometry(color) {
  const b = new Builder();
  b.box(0, 0.28, 0, 0.9, 0.36, 0.9, color);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    b.box(Math.cos(a) * 0.36, 0.66, Math.sin(a) * 0.36, 0.22, 0.5, 0.22, color);
  }
  b.box(0, 0.52, 0, 0.62, 0.14, 0.62, color);
  return b.geometry();
}

export class World {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 300);
    this.pmrem = new THREE.PMREMGenerator(renderer);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0.55);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.15);
    this.sun.position.set(6, 14, -6);
    this.scene.add(this.hemi, this.sun, this.sun.target);

    this.trackGroup = null;
    this.track = null;
    this._dummy = new THREE.Object3D();
    this._color = new THREE.Color();
    this._buildBall();
  }

  _buildBall() {
    const geo = new THREE.IcosahedronGeometry(BALL_RADIUS, 2);
    this.ballMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.22, metalness: 0.35,
      emissive: 0x222222, emissiveIntensity: 0.3, envMapIntensity: 1.1,
    });
    this.ball = new THREE.Mesh(geo, this.ballMaterial);
    this.scene.add(this.ball);

    const shadowGeo = new THREE.CircleGeometry(BALL_RADIUS * 1.35, 20);
    this.ballShadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false,
    }));
    this.ballShadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.ballShadow);
  }

  /** Remplace entièrement la piste affichée. */
  load(track) {
    this.dispose();
    this.track = track;
    const p = track.palette;
    this.rowDuration = rowDuration(track.bpm, track.rowsPerBeat);
    this.speed = trackSpeed(track.bpm, track.rowsPerBeat);
    this.cameraBack = cameraDistance(this.speed);

    const sky = skyTexture(p.skyTop, p.skyBottom);
    this.scene.background = sky;
    this.scene.environment = this.pmrem.fromEquirectangular(sky).texture;
    this.scene.fog = new THREE.Fog(p.fog, 34, 42 + this.speed * 6);
    this.hemi.color.set(p.skyBottom);
    this.hemi.groundColor.set(p.fog);
    this.ballMaterial.color.set(p.ball);
    // Un simple liseré de couleur : au-delà, la bille prend la teinte de la
    // piste et cesse de se détacher du décor.
    this.ballMaterial.emissive.set(p.accent);
    this.ballMaterial.emissiveIntensity = 0.1;

    this.trackGroup = new THREE.Group();
    this.scene.add(this.trackGroup);
    this.trackGroup.add(starfield(p.neon));

    this._buildStatic();
    this._buildMovers();
    this._buildPickups();
    this._buildDecor();
  }

  dispose() {
    if (!this.trackGroup) return;
    this.trackGroup.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const list = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of list) m.dispose();
      }
    });
    this.scene.remove(this.trackGroup);
    this.trackGroup = null;
  }

  _materials() {
    return {
      solide: new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 0.55, metalness: 0.08,
        envMapIntensity: 0.55, side: THREE.DoubleSide, flatShading: true,
      }),
      neon: new THREE.MeshBasicMaterial({
        vertexColors: true, toneMapped: false, side: THREE.DoubleSide,
      }),
    };
  }

  _buildStatic() {
    const { rows, totalRows, grid, palette: p } = this.track;
    const solide = new Builder();
    const neon = new Builder();

    for (let row = 0; row < totalRows; row++) {
      const z = row * TILE;
      const teinte = p.floors[row % p.floors.length];
      for (let col = 0; col < COLS; col++) {
        const ch = grid.cellAt(row, col);
        if (ch === VOID || ch === PLATFORM) continue;
        const x = colX(col);
        const base = new THREE.Color(teinte).multiplyScalar((row + col) % 2 ? 1.1 : 0.92);
        solide.box(x, -0.3, z, TILE * 0.97, 0.6, TILE * 0.97, base.getHex());

        if (ch === BLOCK) {
          // Dessiné plus bas, d'un seul tenant par tronçon.
        } else if (ch === JUMP) {
          neon.box(x, 0.09, z, TILE * 0.82, 0.18, TILE * 0.82, p.neon);
          solide.box(x, 0.05, z, TILE * 0.92, 0.1, TILE * 0.92, p.accent);
        } else if (ch === BELT_R || ch === BELT_L) {
          const dir = ch === BELT_R ? 1 : -1;
          solide.box(x, 0.04, z, TILE * 0.94, 0.12, TILE * 0.94, p.block);
          // Chevrons orientés dans le sens de la poussée.
          for (let i = -1; i <= 1; i++) {
            neon.box(x + i * 0.5 * dir, 0.13, z + i * 0.35, 0.34, 0.08, 0.9, p.neon);
          }
        } else if (ch === CHECKPOINT && col === rows[row].indexOf(CHECKPOINT)) {
          this._portique(solide, neon, z, p);
        }
      }

      // Les blocs contigus deviennent une barrière d'un seul tenant.
      //
      // Posés colonne par colonne, ils formaient un alignement de gros cubes
      // collés, avec des joints partout et aucune lecture d'ensemble. En un
      // seul volume, la porte se lit comme une ouverture dans un mur, ce
      // qu'elle est. La collision, elle, reste calculée case par case.
      let debut = -1;
      for (let col = 0; col <= COLS; col++) {
        const bloc = col < COLS && grid.cellAt(row, col) === BLOCK;
        if (bloc && debut < 0) debut = col;
        if (!bloc && debut >= 0) {
          const largeur = (col - debut) * TILE - (TILE - BLOCK_SIZE);
          const centre = (colX(debut) + colX(col - 1)) / 2;
          solide.box(centre, BLOCK_HEIGHT / 2, z, largeur, BLOCK_HEIGHT, BLOCK_SIZE * 0.82, p.block);
          neon.box(centre, BLOCK_HEIGHT + 0.06, z, largeur * 0.94, 0.14, BLOCK_SIZE * 0.55, p.accent);
          // Montants aux extrémités : ils marquent le bord de l'ouverture.
          for (const bout of [debut, col - 1]) {
            solide.box(colX(bout) + (bout === debut ? -1 : 1) * (BLOCK_SIZE * 0.42),
              BLOCK_HEIGHT / 2, z, 0.22, BLOCK_HEIGHT * 1.12, BLOCK_SIZE * 0.9, p.accent);
          }
          debut = -1;
        }
      }

      const gauche = this._edge(row, -1);
      const droite = this._edge(row, 1);
      if (gauche !== null) neon.box(colX(gauche) - TILE * 0.52, 0.02, z, 0.12, 0.1, TILE * 0.97, p.accent);
      if (droite !== null) neon.box(colX(droite) + TILE * 0.52, 0.02, z, 0.12, 0.1, TILE * 0.97, p.accent);
    }

    const mats = this._materials();
    this.trackGroup.add(new THREE.Mesh(solide.geometry(), mats.solide));
    this.trackGroup.add(new THREE.Mesh(neon.geometry(), mats.neon));
  }

  /**
   * Portique de checkpoint.
   *
   * Il doit se voir de loin et se comprendre sans texte, donc trois signaux
   * qui se renforcent : un marquage au sol qui barre toute la piste, des
   * chevrons qui disent le sens, et une structure verticale assez épaisse
   * pour se détacher du décor. Deux tiges et une barre ne suffisaient pas.
   */
  _portique(solide, neon, z, p) {
    const largeur = (TRACK_HALF + 1.4) * 2;

    // Bande peinte au sol, plus deux liserés qui l'encadrent.
    neon.box(0, 0.06, z, TRACK_HALF * 2 + TILE, 0.12, TILE * 0.5, p.accent);
    for (const d of [-1, 1]) {
      neon.box(0, 0.05, z + d * TILE * 0.42, TRACK_HALF * 2 + TILE, 0.1, TILE * 0.12, p.neon);
    }
    // Chevrons : ils indiquent le sens de la marche.
    for (let i = -2; i <= 2; i++) {
      neon.box(i * TILE * 0.9, 0.07, z - TILE * 0.62, TILE * 0.34, 0.12, TILE * 0.2, p.neon);
    }

    for (const side of [-1, 1]) {
      const x = side * (TRACK_HALF + 1.4);
      solide.box(x, 0.4, z, 1.5, 0.8, 1.5, p.block); // socle massif
      solide.box(x, 2.6, z, 0.85, 4.4, 0.85, p.block); // fût
      neon.box(x, 2.6, z, 0.95, 3.6, 0.24, p.accent); // bande lumineuse verticale
      solide.box(x, 5.1, z, 1.3, 0.7, 1.3, p.block); // chapiteau
      neon.box(x, 5.5, z, 1.05, 0.3, 1.05, p.neon); // lampe
      // Fanion, orienté vers l'intérieur de la piste.
      neon.box(x - side * 0.9, 4.5, z, 1.4, 0.9, 0.14, p.accent);
    }

    // Poutre principale, doublée d'un néon plus fin au-dessus.
    solide.box(0, 5.4, z, largeur, 0.55, 0.8, p.block);
    neon.box(0, 5.05, z, largeur - 0.6, 0.22, 0.5, p.accent);
    neon.box(0, 5.95, z, largeur - 1.6, 0.16, 0.36, p.neon);
    // Dents suspendues sous la poutre : elles cadrent le passage.
    for (let i = -3; i <= 3; i++) {
      neon.box(i * (largeur / 8), 4.6, z, 0.16, 0.9, 0.16, p.neon);
    }
  }

  _edge(row, dir) {
    const line = this.track.rows[row];
    if (dir < 0) {
      for (let c = 0; c < COLS; c++) if (line[c] !== VOID && line[c] !== PLATFORM) return c;
    } else {
      for (let c = COLS - 1; c >= 0; c--) if (line[c] !== VOID && line[c] !== PLATFORM) return c;
    }
    return null;
  }

  _buildDecor() {
    if (!this.track.decor) return;
    const solide = new Builder();
    const neon = new Builder();
    this.track.decor({
      rows: this.track.totalRows,
      TILE,
      colX,
      rowZ: (row) => row * TILE,
      palette: this.track.palette,
      box: (...args) => solide.box(...args),
      neon: (...args) => neon.box(...args),
    });
    const mats = this._materials();
    if (!solide.empty) this.trackGroup.add(new THREE.Mesh(solide.geometry(), mats.solide));
    if (!neon.empty) this.trackGroup.add(new THREE.Mesh(neon.geometry(), mats.neon));
  }

  /**
   * Obstacles animés. Leur position est une fonction pure du temps musical,
   * donc leur état au moment où la bille atteint la ligne est toujours le même.
   */
  _buildMovers() {
    const { grid, totalRows, palette: p, rowsPerBeat, bpm } = this.track;
    const beat = 60 / bpm;
    this.movers = [];
    this.risers = [];
    this.presses = [];
    this.lasers = [];

    const mobileMat = () => new THREE.MeshStandardMaterial({
      color: p.block, roughness: 0.4, metalness: 0.12,
      emissive: new THREE.Color(p.block).multiplyScalar(0.22), flatShading: true,
    });

    const platesVues = new Set();
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < COLS; col++) {
        const ch = grid.cellAt(row, col);

        if (ch === SWEEPER || ch === SLIDER) {
          const balayeuse = ch === SWEEPER;
          const largeur = balayeuse ? TILE * 3 : BLOCK_SIZE;
          const profondeur = balayeuse ? TILE * 0.8 : BLOCK_SIZE;
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(largeur, BLOCK_HEIGHT, profondeur), mobileMat());
          mesh.position.set(0, BLOCK_HEIGHT / 2, row * TILE);
          this.trackGroup.add(mesh);
          // Le sens se déduit de la ligne, pas de l'ordre de création : le
          // générateur de carte doit pouvoir calculer le côté sûr lui aussi.
          const sens = sensBalayage(row);
          this.movers.push({
            mesh, row, type: ch, solid: false,
            anchorX: colX(col), halfW: largeur / 2, halfD: profondeur / 2,
            amplitude: (balayeuse ? TRACK_HALF - TILE : TILE) * sens,
            period: (balayeuse ? SWEEPER_PERIOD_BEATS : SLIDER_PERIOD_BEATS) * beat,
            x: 0,
          });
        } else if (ch === PLATFORM && !platesVues.has(row)) {
          // Les lignes P qui se suivent forment une seule plateforme.
          let fin = row;
          while (grid.cellAt(fin + 1, col) === PLATFORM) fin++;
          for (let r = row; r <= fin; r++) platesVues.add(r);
          const longueur = (fin - row + 1) * TILE;
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(PLATFORM_HALF * 2, 0.6, longueur * 0.97),
            new THREE.MeshStandardMaterial({
              color: p.floors[0], roughness: 0.5, metalness: 0.1, flatShading: true,
            }));
          mesh.position.set(0, -0.3, ((row + fin) / 2) * TILE);
          this.trackGroup.add(mesh);
          this.movers.push({
            mesh, row, rowEnd: fin, type: ch, solid: true,
            anchorX: colX(col), halfW: PLATFORM_HALF, halfD: longueur / 2,
            amplitude: PLATFORM_AMPLITUDE, period: PLATFORM_PERIOD_BEATS * beat,
            x: 0,
          });
        } else if (ch === MARTEAU) {
          // Bras qui balaie à l'horizontale depuis un montant latéral. Il
          // couvre la moitié de piste située de son côté au moment du passage,
          // donc on esquive à l'opposé de sa course.
          const sens = sensBalayage(row);
          const pivotX = sens * (TRACK_HALF + 1.6);
          const longueur = TRACK_HALF + 1.6;
          const groupe = new THREE.Group();
          const montant = new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 0.6, 3.4, 8), mobileMat());
          montant.position.set(pivotX, 1.7, row * TILE);
          const bras = new THREE.Mesh(
            new THREE.BoxGeometry(longueur, 0.7, 0.7), mobileMat());
          // Le bras est décalé pour pivoter autour du montant, pas du centre.
          bras.position.set(-longueur / 2, 0, 0);
          const pivot = new THREE.Group();
          pivot.position.set(pivotX, 1.5, row * TILE);
          pivot.add(bras);
          const tete = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 1.4), mobileMat());
          tete.position.set(-longueur + 0.5, 0, 0);
          pivot.add(tete);
          groupe.add(montant, pivot);
          this.trackGroup.add(groupe);
          this.movers.push({
            mesh: groupe, pivot, row, type: ch, solid: false,
            anchorX: pivotX, sens, longueur,
            // Profondeur bornée sous une demi-ligne, rayon de bille compris :
            // au-delà, le bras tue depuis la ligne voisine, où rien ne
            // l'annonce et où le joueur n'a aucune raison de l'éviter.
            halfW: longueur / 2, halfD: TILE * 0.3,
            period: SWEEPER_PERIOD_BEATS * beat, x: 0,
          });
        } else if (ch === SPINNER) {
          // Croix qui tourne sans fin au milieu de la piste. Son emprise
          // latérale se resserre quand elle s'aligne avec la piste et s'ouvre
          // quand elle se met en travers : le passage sûr tourne avec elle.
          const groupe = new THREE.Group();
          groupe.position.set(colX(col), 1.1, row * TILE);
          // Une seule barre traversant le moyeu : le maillage doit décrire la
          // même chose que la collision, sinon on esquive ce qu'on ne voit pas.
          const barre = new THREE.Mesh(
            new THREE.BoxGeometry(SPINNER_LONGUEUR * 2, 0.55, 0.6), mobileMat());
          groupe.add(barre);
          for (const bout of [-1, 1]) {
            const tete = new THREE.Mesh(new THREE.BoxGeometry(1, 0.9, 1), mobileMat());
            tete.position.x = bout * (SPINNER_LONGUEUR - 0.4);
            groupe.add(tete);
          }
          const moyeu = new THREE.Mesh(
            new THREE.CylinderGeometry(0.7, 0.9, 2.2, 10), mobileMat());
          moyeu.position.y = -0.3;
          groupe.add(moyeu);
          this.trackGroup.add(groupe);
          this.movers.push({
            mesh: groupe, row, type: ch, solid: false,
            anchorX: colX(col), longueur: SPINNER_LONGUEUR,
            // La barre est fine en profondeur, sa collision doit l'être aussi.
            // À 0,3 la zone atteignait presque une demi-ligne de part et
            // d'autre, si bien qu'il fallait avoir déjà quitté la colonne
            // centrale avant même d'aborder la ligne : 40 unités par seconde
            // pour une bille qui plafonne à 38.
            halfW: SPINNER_LONGUEUR, halfD: TILE * 0.16,
            period: SPINNER_PERIOD_BEATS * beat, x: 0,
          });
        } else if (ch === ROUE && !platesVues.has(`O${row}`)) {
          // Les roues arrivent en groupe, décalées : on se faufile entre elles.
          platesVues.add(`O${row}`);
          for (let k = 0; k < 3; k++) {
            // L'axe est basculé dans la géométrie une fois pour toutes, ce qui
            // laisse la rotation du maillage libre pour figurer le roulement.
            const geo = new THREE.CylinderGeometry(0.85, 0.85, TILE * 0.7, 12);
            geo.rotateX(Math.PI / 2);
            const roue = new THREE.Mesh(geo, mobileMat());
            roue.position.set(0, 0.85, row * TILE);
            this.trackGroup.add(roue);
            this.movers.push({
              mesh: roue, row, type: ch, solid: false, roulante: true,
              anchorX: 0, halfW: 0.85, halfD: TILE * 0.35,
              amplitude: (TRACK_HALF - TILE * 0.5) * (k % 2 === 0 ? 1 : -1),
              period: (SWEEPER_PERIOD_BEATS + k) * beat, x: 0,
            });
          }
        } else if (ch === PRESSE) {
          this.presses.push({ row, col, x: colX(col), z: row * TILE });
        } else if (ch === RISER) {
          this.risers.push({ row, col, x: colX(col), z: row * TILE });
        } else if (ch === LASER && col === 3) {
          this.lasers.push({ row, z: row * TILE, bank: laserBank(row, rowsPerBeat) });
        }
      }
    }

    if (this.risers.length) {
      const geo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_HEIGHT, BLOCK_SIZE);
      this.riserMesh = new THREE.InstancedMesh(geo, mobileMat(), this.risers.length);
      this.riserMesh.frustumCulled = false;
      this.trackGroup.add(this.riserMesh);
      // Puits d'où sort le piston, pour que la case reste lisible baissée.
      const puits = new Builder();
      for (const r of this.risers) puits.box(r.x, 0.06, r.z, BLOCK_SIZE * 1.15, 0.14, BLOCK_SIZE * 1.15, p.accent);
      this.trackGroup.add(new THREE.Mesh(puits.geometry(), this._materials().neon));
    }

    if (this.presses.length) {
      // Masse suspendue à un vérin : elle s'abat d'en haut, à l'inverse du
      // piston qui sort du sol. Les deux se répondent au lieu de battre
      // ensemble, ce qui les garde distinguables.
      const geo = new THREE.BoxGeometry(TILE * 0.94, 1.8, TILE * 0.9);
      this.presseMesh = new THREE.InstancedMesh(geo, mobileMat(), this.presses.length);
      this.presseMesh.frustumCulled = false;
      this.trackGroup.add(this.presseMesh);
      const rails = new Builder();
      for (const pr of this.presses) {
        rails.box(pr.x, 5.4, pr.z, 0.24, 3.6, 0.24, p.accent);
        rails.box(pr.x, 7.1, pr.z, TILE * 0.98, 0.4, TILE * 0.9, p.accent);
      }
      this.trackGroup.add(new THREE.Mesh(rails.geometry(), this._materials().neon));
    }

    if (this.lasers.length) {
      const geo = new THREE.BoxGeometry(LASER_HALF * 2, 2.6, 0.14);
      this.laserMesh = new THREE.InstancedMesh(
        geo,
        new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, opacity: 0.85 }),
        this.lasers.length * 2);
      this.laserMesh.frustumCulled = false;
      this.trackGroup.add(this.laserMesh);
      // Bornes fixes de chaque côté, elles annoncent la barrière de loin.
      const bornes = new Builder();
      for (const l of this.lasers) {
        for (const side of [-1, 1]) bornes.box(side * (TRACK_HALF + 0.7), 1.4, l.z, 0.4, 2.8, 0.4, p.accent);
      }
      this.trackGroup.add(new THREE.Mesh(bornes.geometry(), this._materials().neon));
    }
  }

  _buildPickups() {
    const { grid, totalRows, palette: p } = this.track;
    this.diamonds = [];
    this.crowns = [];
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < COLS; col++) {
        const ch = grid.cellAt(row, col);
        if (ch === DIAMOND) this.diamonds.push({ x: colX(col), z: row * TILE, taken: false });
        else if (ch === CROWN) this.crowns.push({ x: colX(col), z: row * TILE, taken: false });
      }
    }
    this.diamondMesh = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.42),
      new THREE.MeshBasicMaterial({ color: p.neon, toneMapped: false }),
      Math.max(1, this.diamonds.length));
    this.diamondMesh.frustumCulled = false;
    this.trackGroup.add(this.diamondMesh);

    this.crownMesh = new THREE.InstancedMesh(
      crownGeometry(0xffffff),
      new THREE.MeshBasicMaterial({ vertexColors: true, color: p.accent, toneMapped: false }),
      Math.max(1, this.crowns.length));
    this.crownMesh.frustumCulled = false;
    this.trackGroup.add(this.crownMesh);
  }

  /**
   * Emprise latérale d'un obstacle mobile à l'instant musical `t`.
   *
   * Le marteau ne translate pas, il pivote : son emprise se déduit de l'angle
   * du bras. Tout passe par cette fonction pour que le rendu, la collision et
   * le pilote de vérification lisent exactement la même chose ; c'est en la
   * contournant que le marteau devenait invisible au calcul d'évitement.
   */
  moverEmprise(mover, t) {
    const arrivee = mover.row * this.rowDuration;
    const phase = (2 * Math.PI * (t - arrivee)) / mover.period;
    if (mover.type === SPINNER) {
      // La croix tourne sans fin ; c'est l'angle qui décide de son emprise.
      // Une barre traversant le moyeu : son emprise latérale est sa longueur
      // projetée sur l'axe des colonnes. Une croix, elle, couvrirait toujours
      // au moins 0,7 fois sa longueur et serait un mur.
      const angle = SPINNER_ANGLE_PASSAGE + phase;
      return {
        x: mover.anchorX,
        halfW: Math.max(0.7, Math.abs(Math.cos(angle)) * mover.longueur),
        angle,
      };
    }
    if (mover.type === MARTEAU) {
      const base = mover.sens > 0 ? 0 : Math.PI;
      const angle = base + mover.sens * (Math.PI / 2) * ((1 - Math.cos(phase)) / 2);
      const bout = mover.anchorX - Math.cos(angle) * mover.longueur;
      return { x: (mover.anchorX + bout) / 2, halfW: Math.abs(mover.anchorX - bout) / 2, angle };
    }
    return { x: mover.anchorX + Math.cos(phase) * mover.amplitude, halfW: mover.halfW };
  }

  /** Position latérale seule, conservée pour les appels existants. */
  moverX(mover, t) {
    return this.moverEmprise(mover, t).x;
  }

  /**
   * Hauteur d'un piston.
   *
   * L'état affiché est celui de la ligne la plus proche, pas celui de
   * l'horloge continue. C'est indispensable : la collision, elle, consulte
   * l'état de la ligne. Calculée sur le temps continu, la course tombait à
   * contretemps et un piston sur deux tuait en paraissant rentré, ce qui est
   * proprement injouable puisque l'obstacle est alors invisible.
   *
   * La course se fait donc entre deux lignes, jamais autour de leur centre.
   */
  riserHeight(t) {
    return this._etatLigne(t, riserUp);
  }

  /** Un pour la presse en bas, zéro pour la presse en haut. */
  presseEtat(t) {
    return this._etatLigne(t, presseBasse);
  }

  /**
   * État affiché d'un obstacle dont la collision dépend de la ligne.
   *
   * On lit l'état de la ligne la plus proche, pas celui de l'horloge continue,
   * et la course se fait entre deux lignes. Calculé sur le temps, l'obstacle
   * tomberait à contretemps et tuerait en paraissant inoffensif.
   */
  _etatLigne(t, regle) {
    const rowF = t / this.rowDuration;
    const row = Math.round(rowF);
    const rpb = this.track.rowsPerBeat;
    const ici = regle(row, rpb) ? 1 : 0;
    const ecart = rowF - row;
    if (Math.abs(ecart) < 0.35) return ici;
    const voisine = regle(row + Math.sign(ecart), rpb) ? 1 : 0;
    return ici + (voisine - ici) * Math.min(1, (Math.abs(ecart) - 0.35) / 0.15);
  }

  update(t, player) {
    const d = this._dummy;

    for (const m of this.movers) {
      const emprise = this.moverEmprise(m, t);
      m.x = emprise.x;
      if (m.type === SPINNER) {
        m.mesh.rotation.y = emprise.angle;
        m.halfW = emprise.halfW;
        continue;
      }
      if (m.type === MARTEAU) {
        // Le bras est en travers de la piste au moment du passage, et s'efface
        // entre deux : on esquive du côté opposé à sa course.
        m.pivot.rotation.y = emprise.angle;
        m.halfW = emprise.halfW;
        continue;
      }
      m.mesh.position.x = m.x;
      if (m.roulante) m.mesh.rotation.z = -m.x / 0.85;
    }

    if (this.presseMesh) {
      for (let i = 0; i < this.presses.length; i++) {
        const pr = this.presses[i];
        const bas = this.presseEtat(t, pr.row);
        d.position.set(pr.x, 0.95 + (1 - bas) * 3.4, pr.z);
        d.rotation.set(0, 0, 0);
        d.scale.setScalar(1);
        d.updateMatrix();
        this.presseMesh.setMatrixAt(i, d.matrix);
      }
      this.presseMesh.instanceMatrix.needsUpdate = true;
    }

    if (this.riserMesh) {
      const h = this.riserHeight(t);
      for (let i = 0; i < this.risers.length; i++) {
        const r = this.risers[i];
        d.position.set(r.x, BLOCK_HEIGHT / 2 - BLOCK_HEIGHT * (1 - h), r.z);
        d.rotation.set(0, 0, 0);
        d.scale.setScalar(1);
        d.updateMatrix();
        this.riserMesh.setMatrixAt(i, d.matrix);
      }
      this.riserMesh.instanceMatrix.needsUpdate = true;
    }

    if (this.laserMesh) {
      // Chaque barrière affiche le côté qui sera allumé au moment où la bille
      // l'atteindra, pas celui de l'instant présent. Sinon on lit une moitié
      // barrée de loin, on se place de l'autre côté, et tout bascule à
      // l'arrivée : le passage devient injouable alors qu'il est correct.
      const pulsation = 0.82 + Math.sin(t * 12) * 0.18;
      const vif = this._color.set(this.track.palette.block).multiplyScalar(pulsation);
      const eteint = new THREE.Color(this.track.palette.accent).multiplyScalar(0.18);
      for (let i = 0; i < this.lasers.length; i++) {
        const l = this.lasers[i];
        ['gauche', 'droite'].forEach((cote, k) => {
          const idx = i * 2 + k;
          const allume = cote === l.bank;
          d.position.set(cote === 'gauche' ? -LASER_CENTER : LASER_CENTER, allume ? 1.35 : 0.2, l.z);
          d.rotation.set(0, 0, 0);
          d.scale.set(1, allume ? 1 : 0.12, 1);
          d.updateMatrix();
          this.laserMesh.setMatrixAt(idx, d.matrix);
          this.laserMesh.setColorAt(idx, allume ? vif : eteint);
        });
      }
      this.laserMesh.instanceMatrix.needsUpdate = true;
      if (this.laserMesh.instanceColor) this.laserMesh.instanceColor.needsUpdate = true;
    }

    for (let i = 0; i < this.diamonds.length; i++) {
      const dia = this.diamonds[i];
      d.position.set(dia.x, dia.taken ? -999 : 0.95 + Math.sin(t * 3 + i) * 0.12, dia.z);
      d.rotation.set(0.4, t * 2.2 + i, 0);
      d.scale.setScalar(dia.taken ? 0.0001 : 1);
      d.updateMatrix();
      this.diamondMesh.setMatrixAt(i, d.matrix);
    }
    this.diamondMesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < this.crowns.length; i++) {
      const cr = this.crowns[i];
      d.position.set(cr.x, cr.taken ? -999 : 1.05 + Math.sin(t * 2 + i) * 0.1, cr.z);
      d.rotation.set(0, t * 1.4 + i, 0);
      d.scale.setScalar(cr.taken ? 0.0001 : 1.15);
      d.updateMatrix();
      this.crownMesh.setMatrixAt(i, d.matrix);
    }
    this.crownMesh.instanceMatrix.needsUpdate = true;

    this.ball.position.set(player.x, player.y, player.z);
    this.ball.rotation.x = player.z / BALL_RADIUS;
    this.ball.rotation.z = -player.x / BALL_RADIUS;
    this.ballShadow.position.set(player.x, 0.03, player.z);
    this.ballShadow.visible = player.y < 3;
    this.ballShadow.material.opacity = 0.35 * Math.max(0, 1 - player.y / 3);

    this.sun.position.set(player.x + 6, 14, player.z - 6);
    this.sun.target.position.set(player.x, 0, player.z);
    this.sun.target.updateMatrixWorld();
  }

  updateCamera(player, shake = 0) {
    const cam = this.camera;
    const back = this.cameraBack || 9.5;
    cam.position.x += (player.x * 0.42 - cam.position.x) * 0.18;
    cam.position.y += (5.5 + player.y * 0.45 - cam.position.y) * 0.14;
    cam.position.z = player.z - back;
    if (shake > 0) {
      cam.position.x += Math.sin(shake * 47) * shake * 0.4;
      cam.position.y += Math.cos(shake * 61) * shake * 0.3;
    }
    cam.lookAt(player.x * 0.55, 1.2, player.z + back * 1.15);
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}

export { PLATFORM_HALF, LASER_HALF, LASER_CENTER };
