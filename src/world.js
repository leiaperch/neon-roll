import * as THREE from 'three';
import {
  COLS, TILE, TRACK_HALF, BALL_RADIUS, BLOCK_SIZE, BLOCK_HEIGHT,
  SECTIONS, SKY_TOP, SKY_BOTTOM, FOG_COLOR, FOG_NEAR, FOG_FAR,
  ROW_DURATION, BPM, SWEEPER_PERIOD_BEATS, SLIDER_PERIOD_BEATS,
} from './config.js';
import {
  ROWS, TOTAL_ROWS, cellAt, BLOCK, DIAMOND, JUMP, CHECKPOINT, SWEEPER, SLIDER, VOID,
} from './level.js';

const BEAT = 60 / BPM;

/** Accumulateur de triangles : un seul mesh par matériau. */
class Builder {
  constructor() {
    this.pos = [];
    this.nor = [];
    this.col = [];
  }

  /** Boîte alignée sur les axes, normales à plat, teinte assombrie par face. */
  box(cx, cy, cz, sx, sy, sz, color, shade = { top: 1, side: 0.72, bottom: 0.45 }) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const v = [
      [cx - hx, cy - hy, cz - hz], [cx + hx, cy - hy, cz - hz],
      [cx + hx, cy + hy, cz - hz], [cx - hx, cy + hy, cz - hz],
      [cx - hx, cy - hy, cz + hz], [cx + hx, cy - hy, cz + hz],
      [cx + hx, cy + hy, cz + hz], [cx - hx, cy + hy, cz + hz],
    ];
    const faces = [
      [[4, 5, 6], [4, 6, 7], [0, 0, 1], shade.side], // +z
      [[1, 0, 3], [1, 3, 2], [0, 0, -1], shade.side], // -z
      [[5, 1, 2], [5, 2, 6], [1, 0, 0], shade.side], // +x
      [[0, 4, 7], [0, 7, 3], [-1, 0, 0], shade.side], // -x
      [[3, 7, 6], [3, 6, 2], [0, 1, 0], shade.top], // +y
      [[4, 0, 1], [4, 1, 5], [0, -1, 0], shade.bottom], // -y
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

  build(material) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    return new THREE.Mesh(g, material);
  }
}

const colX = (col) => (col - (COLS - 1) / 2) * TILE;
const rowZ = (row) => row * TILE;
const sectionOf = (row) => SECTIONS[Math.min(SECTIONS.length - 1, Math.floor(row / 32))];

/** Dégradé vertical utilisé à la fois en fond et en éclairage d'ambiance. */
function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, `#${SKY_TOP.toString(16).padStart(6, '0')}`);
  grad.addColorStop(0.62, `#${SKY_BOTTOM.toString(16).padStart(6, '0')}`);
  grad.addColorStop(1, '#050713');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 8, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Champ d'étoiles fixe, purement décoratif, une seule draw call. */
function starfield() {
  const count = 600;
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
  const m = new THREE.PointsMaterial({ color: 0x9fc7ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.7, fog: false });
  const points = new THREE.Points(g, m);
  points.frustumCulled = false;
  return points;
}

export class World {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

    const sky = skyTexture();
    this.scene.background = sky;
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.scene.environment = pmrem.fromEquirectangular(sky).texture;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 260);

    const hemi = new THREE.HemisphereLight(0xbcd8ff, 0x0a0f24, 0.55);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 1.15);
    sun.position.set(6, 14, -6);
    this.scene.add(sun);
    this.sun = sun;

    // Les étoiles suivent la caméra : elles doivent se lire comme infiniment loin.
    this.stars = starfield();
    this.scene.add(this.stars);

    this._buildTrack();
    this._buildDiamonds();
    this._buildBall();
  }

  _buildTrack() {
    const floor = new Builder();
    const blocks = new Builder();
    const neon = new Builder();

    for (let row = 0; row < TOTAL_ROWS; row++) {
      const sec = sectionOf(row);
      const z = rowZ(row);
      for (let col = 0; col < COLS; col++) {
        const ch = cellAt(row, col);
        if (ch === VOID) continue;
        const x = colX(col);

        // Damier discret pour lire la vitesse.
        const tint = new THREE.Color(sec.floor).multiplyScalar((row + col) % 2 ? 1.14 : 0.94);
        floor.box(x, -0.3, z, TILE * 0.97, 0.6, TILE * 0.97, tint.getHex());

        if (ch === BLOCK) {
          blocks.box(x, BLOCK_HEIGHT / 2, z, BLOCK_SIZE, BLOCK_HEIGHT, BLOCK_SIZE, sec.block);
          neon.box(x, BLOCK_HEIGHT + 0.06, z, BLOCK_SIZE * 0.62, 0.12, BLOCK_SIZE * 0.62, sec.accent);
        } else if (ch === JUMP) {
          neon.box(x, 0.09, z, TILE * 0.8, 0.18, TILE * 0.8, 0x7cf6b0);
        } else if (ch === CHECKPOINT) {
          // L'arche occupe toute la ligne, on ne la dessine qu'une fois.
          if (col === ROWS[row].indexOf(CHECKPOINT)) this._checkpointArch(neon, z, sec.accent);
        }
      }
      // Liseré lumineux sur les bords extérieurs de la piste.
      const left = ROWS[row].indexOf('#') >= 0 ? this._edge(row, -1) : null;
      const right = this._edge(row, 1);
      if (left !== null) neon.box(colX(left) - TILE * 0.52, 0.02, z, 0.12, 0.1, TILE * 0.97, sec.accent);
      if (right !== null) neon.box(colX(right) + TILE * 0.52, 0.02, z, 0.12, 0.1, TILE * 0.97, sec.accent);
    }

    const solidMat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.55, metalness: 0.05,
      envMapIntensity: 0.5, side: THREE.DoubleSide, flatShading: true,
    });
    const neonMat = new THREE.MeshBasicMaterial({
      vertexColors: true, toneMapped: false, side: THREE.DoubleSide, fog: true,
    });

    this.floorMesh = floor.build(solidMat);
    this.blockMesh = blocks.build(solidMat);
    this.neonMesh = neon.build(neonMat);
    this.scene.add(this.floorMesh, this.blockMesh, this.neonMesh);

    this._buildMovers();
  }

  /** Colonne de sol la plus extérieure d'une ligne, ou null si la ligne est vide. */
  _edge(row, dir) {
    const line = ROWS[row];
    if (dir < 0) {
      for (let c = 0; c < COLS; c++) if (line[c] !== VOID) return c;
    } else {
      for (let c = COLS - 1; c >= 0; c--) if (line[c] !== VOID) return c;
    }
    return null;
  }

  _checkpointArch(neon, z, color) {
    for (const side of [-1, 1]) {
      neon.box(side * (TRACK_HALF + 0.9), 1.6, z, 0.3, 3.2, 0.3, color);
    }
    neon.box(0, 3.25, z, (TRACK_HALF + 1.05) * 2, 0.3, 0.3, color);
  }

  /**
   * Obstacles mobiles. Leur position est une fonction pure du temps musical :
   * quand la bille atteint la ligne, la barre est toujours à la même place.
   */
  _buildMovers() {
    this.movers = [];
    const group = new THREE.Group();
    for (let row = 0; row < TOTAL_ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const ch = cellAt(row, col);
        if (ch !== SWEEPER && ch !== SLIDER) continue;
        const sec = sectionOf(row);
        const isSweeper = ch === SWEEPER;
        const width = isSweeper ? TILE * 3 : BLOCK_SIZE;
        const geo = new THREE.BoxGeometry(width, BLOCK_HEIGHT, isSweeper ? TILE * 0.8 : BLOCK_SIZE);
        const mat = new THREE.MeshStandardMaterial({
          color: sec.block, roughness: 0.4, metalness: 0.1,
          emissive: new THREE.Color(sec.block).multiplyScalar(0.25), flatShading: true,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, BLOCK_HEIGHT / 2, rowZ(row));
        group.add(mesh);
        // Un obstacle sur deux balaie dans l'autre sens : le côté sûr alterne.
        const dir = this.movers.length % 2 === 0 ? 1 : -1;
        this.movers.push({
          mesh,
          row,
          type: ch,
          anchorX: colX(col),
          halfW: width / 2,
          halfD: (isSweeper ? TILE * 0.8 : BLOCK_SIZE) / 2,
          amplitude: (isSweeper ? TRACK_HALF - TILE : TILE) * dir,
          period: (isSweeper ? SWEEPER_PERIOD_BEATS : SLIDER_PERIOD_BEATS) * BEAT,
          height: BLOCK_HEIGHT,
          x: 0,
        });
      }
    }
    this.scene.add(group);
  }

  _buildDiamonds() {
    this.diamonds = [];
    for (let row = 0; row < TOTAL_ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (cellAt(row, col) === DIAMOND) {
          this.diamonds.push({ row, col, x: colX(col), z: rowZ(row), taken: false });
        }
      }
    }
    const geo = new THREE.OctahedronGeometry(0.42);
    const mat = new THREE.MeshBasicMaterial({ color: 0x8ef6ff, toneMapped: false });
    this.diamondMesh = new THREE.InstancedMesh(geo, mat, Math.max(1, this.diamonds.length));
    this.diamondMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.diamondMesh.frustumCulled = false;
    this.scene.add(this.diamondMesh);
    this._dummy = new THREE.Object3D();
  }

  _buildBall() {
    const geo = new THREE.IcosahedronGeometry(BALL_RADIUS, 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf6f9ff, roughness: 0.25, metalness: 0.2,
      emissive: 0x2a4a8a, emissiveIntensity: 0.35, envMapIntensity: 0.9,
    });
    this.ball = new THREE.Mesh(geo, mat);
    this.scene.add(this.ball);

    // Ombre simulée : un disque sombre plaqué au sol, gratuit sur mobile.
    const shadowGeo = new THREE.CircleGeometry(BALL_RADIUS * 1.3, 20);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });
    this.ballShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.ballShadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.ballShadow);
  }

  /** Position d'un obstacle mobile à l'instant musical `t`. */
  moverX(mover, t) {
    const arrival = mover.row * ROW_DURATION;
    return mover.anchorX + Math.cos((2 * Math.PI * (t - arrival)) / mover.period) * mover.amplitude;
  }

  update(t, player) {
    for (const m of this.movers) {
      m.x = this.moverX(m, t);
      m.mesh.position.x = m.x;
    }

    const d = this._dummy;
    for (let i = 0; i < this.diamonds.length; i++) {
      const dia = this.diamonds[i];
      if (dia.taken) {
        d.position.set(0, -999, 0);
        d.scale.setScalar(0.0001);
      } else {
        d.position.set(dia.x, 0.95 + Math.sin(t * 3 + i) * 0.12, dia.z);
        d.scale.setScalar(1);
      }
      d.rotation.set(0.4, t * 2.2 + i, 0);
      d.updateMatrix();
      this.diamondMesh.setMatrixAt(i, d.matrix);
    }
    this.diamondMesh.instanceMatrix.needsUpdate = true;

    this.ball.position.set(player.x, player.y, player.z);
    this.ball.rotation.x = player.z / BALL_RADIUS;
    this.ball.rotation.z = -player.x / BALL_RADIUS;
    this.ballShadow.position.set(player.x, 0.03, player.z);
    this.ballShadow.visible = player.grounded || player.jumping;
    this.ballShadow.material.opacity = 0.35 * Math.max(0, 1 - player.y / 3);

    this.stars.position.z = player.z;
    this.sun.position.set(player.x + 6, 14, player.z - 6);
    this.sun.target.position.set(player.x, 0, player.z);
    this.sun.target.updateMatrixWorld();
  }

  updateCamera(player, shake = 0) {
    const cam = this.camera;
    const targetX = player.x * 0.42;
    cam.position.x += (targetX - cam.position.x) * 0.18;
    cam.position.y += (5.5 + player.y * 0.45 - cam.position.y) * 0.14;
    cam.position.z = player.z - 9.5;
    if (shake > 0) {
      cam.position.x += Math.sin(shake * 47) * shake * 0.4;
      cam.position.y += Math.cos(shake * 61) * shake * 0.3;
    }
    cam.lookAt(player.x * 0.55, 1.2, player.z + 11);
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
