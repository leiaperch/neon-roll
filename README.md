# Neon Roll

Jeu d'adresse web pour téléphone : une bille roule seule sur une piste néon
suspendue, on la dirige au doigt pour éviter les blocs, franchir les trous et
ramasser les diamants. Un niveau complet de 60 secondes, calé sur une musique
générée à la volée.

Tout est original : la piste, la musique et les visuels sont produits par le
code du projet, il n'y a aucun asset importé.

## Démarrer

```bash
npm install
```

```bash
npm run dev
```

Le serveur écoute sur le port 5183 et accepte les connexions du réseau local :
sur le téléphone, ouvrir `http://<ip-du-pc>:5183` (l'adresse est affichée au
lancement). Pour construire la version déployable :

```bash
npm run build
```

Le dossier `dist/` est prêt pour GitHub Pages, Netlify ou Vercel. En HTTPS, le
service worker s'installe et le jeu devient installable sur l'écran d'accueil
(PWA plein écran, orientation portrait) et jouable hors ligne.

## Principe de synchronisation

Rien n'est animé « à peu près » : une ligne de la carte du niveau vaut
exactement une croche du morceau, et l'horloge du jeu est celle du contexte
audio. La position de la bille se déduit du temps musical, donc les obstacles
tombent forcément sur les temps, quel que soit le nombre d'images par seconde.

| Grandeur | Valeur |
| --- | --- |
| Tempo | 128 BPM |
| Ligne | 1 croche, soit 0,234 s et 2 unités de monde |
| Niveau | 256 lignes, 32 mesures, 60 s |
| Vitesse | 8,53 unités/s |
| Checkpoints | lignes 24, 80, 125, 172, 219 |

## Éditer le niveau

Le niveau est une carte ASCII dans `src/level.js`, une ligne de 7 caractères
par croche.

| Caractère | Case |
| --- | --- |
| `.` | vide, la bille tombe |
| `#` | sol |
| `X` | bloc à esquiver |
| `o` | diamant |
| `^` | tremplin, saut de 5 lignes |
| `*` | checkpoint sur toute la ligne |
| `~` | barre balayeuse |
| `=` | bloc coulissant |

Après modification :

```bash
npm run validate
```

Le validateur refuse les lignes mal dimensionnées et vérifie qu'il existe un
chemin où la bille ne change jamais de plus d'une colonne par ligne, sauts
compris. Une carte qui passe le validateur est franchissable.

Les couleurs changent toutes les 32 lignes, une entrée par section dans
`SECTIONS` (`src/config.js`).

## Organisation

| Fichier | Rôle |
| --- | --- |
| `src/config.js` | constantes de rythme, de piste et palette |
| `src/level.js` | carte du niveau et validateur, sans dépendance |
| `src/music.js` | séquenceur et synthèse WebAudio, horloge maîtresse |
| `src/world.js` | construction de la scène three.js et animation |
| `src/game.js` | états, collisions, checkpoints, progression |
| `src/input.js` | glissé tactile et clavier de secours |
| `src/ui.js` | HUD et panneaux, bascule de classes uniquement |
| `tools/validate-level.mjs` | validation du niveau en ligne de commande |
| `tools/capture-sink.mjs` | collecteur de captures pour vérifier le rendu |

## Notes de conception

La géométrie de la piste est fusionnée par matériau : la piste entière tient en
trois maillages (sol, blocs, néons) plus une instance pour les diamants, soit
une poignée d'appels de rendu pour 256 lignes. L'ombre de la bille est un
disque plaqué au sol plutôt qu'une vraie ombre portée, pour tenir le taux
d'images sur téléphone.

Deux réglages non intuitifs, tous deux issus de tests :

- la profondeur de collision d'un bloc est bridée sous une demi-ligne, sinon
  deux obstacles proches se recouvrent et ne laissent aucun couloir latéral ;
- les obstacles mobiles ont une période longue (6 temps), parce que la bille
  reste environ 0,27 s dans la zone de collision d'une ligne : un va-et-vient
  rapide ne laisserait aucun côté sûr au moment du passage.

## Vérifier le rendu

`?debug` conserve le tampon de dessin et expose `window.__neonroll`
(`game`, `world`, `renderer`, `music`). Avec `tools/capture-sink.mjs` lancé, la
page peut poster `renderer.domElement.toDataURL()` pour écrire de vraies
captures sur disque.
