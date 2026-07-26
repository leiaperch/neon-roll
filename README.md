# SILLON

Jeu d'adresse web pour téléphone. Un diamant de platine lit un disque : il
avance seul dans le sillon, on le dirige au doigt pour éviter les obstacles,
franchir les trous et ramasser les diamants. Cinq pistes, cinq genres
musicaux, chacune avec son tempo, sa lumière et son décor.

Tout est original et produit par le code : les cartes, la musique et les
visuels. Aucun asset importé, aucun fichier audio.

## Le disque

| | Piste | Genre | Tempo | Durée | Caractère |
| --- | --- | --- | --- | --- | --- |
| A1 | Poussière de Delta | Blues | 84 | 1:09 | route large, tapis roulants, apprentissage |
| A2 | Cabinet des Miroirs | Baroque | 100 | 1:07 | symétries, grilles dorées, plateformes |
| B3 | Cartouche 03 | Chiptune | 150 | 0:58 | damiers, pistons, tout est carré |
| B4 | Sous-sol, 4 h | Techno | 132 | 1:06 | boucles, barres, faisceaux |
| B5 | Enclume | Metal | 176 | 0:55 | la plus rapide, forge et chaînes |

Le tempo n'est pas décoratif : il fixe la vitesse de défilement. Le blues
avance à 5,6 unités par seconde, le metal à 11,7. La caméra recule d'autant,
pour garder un temps de lecture comparable.

## Démarrer

```bash
npm install
```

```bash
npm run dev
```

Le serveur écoute sur le port 5183 et accepte le réseau local : sur le
téléphone, ouvrir `http://<ip-du-pc>:5183`. Pour la version déployable :

```bash
npm run build
```

En HTTPS, le service worker s'installe et le jeu devient installable sur
l'écran d'accueil (plein écran, portrait) et jouable hors ligne.

## Principe de synchronisation

Une ligne de carte vaut exactement une croche du morceau qui l'accompagne, et
l'horloge du jeu est celle du contexte audio. La position de la bille se
déduit du temps musical, jamais du temps écoulé entre deux images : les
obstacles tombent donc sur les temps quel que soit le nombre d'images par
seconde, et une reprise au checkpoint redémarre la musique à la bonne croche.

Les obstacles animés suivent la même règle. Leur position est une fonction du
temps musical, donc leur état au moment où la bille atteint une ligne est
toujours le même, et c'est exactement celui que le validateur a vérifié.

## Écrire une piste

Une piste ne s'écrit pas d'un bloc : on écrit des **phrases de huit lignes**
(une mesure) et on les **arrange**, comme le morceau qui les accompagne.
Répéter une phrase puis la reprendre en miroir donne la même sensation qu'un
refrain, et tout reste écrit à la main.

```js
phrases: {
  slalom: `
    .#####.
    .##X##.
    .#####.
    .#X#X#.
    ...`,
},
arrangement: ['intro', 'slalom', 'slalom:m', 'halte'],
```

Le suffixe `:m` joue la phrase en miroir, tapis roulants inversés compris.

| Caractère | Case |
| --- | --- |
| `.` | vide, la bille tombe |
| `#` | sol |
| `X` | bloc à esquiver |
| `o` | diamant |
| `Q` | couronne |
| `^` | tremplin, saut de 5 lignes |
| `*` | checkpoint sur toute la ligne |
| `~` | barre balayeuse |
| `=` | bloc coulissant |
| `L` | faisceau : barre une moitié de piste, l'autre au temps suivant |
| `B` | piston : sorti un temps sur deux |
| `>` `<` | tapis roulant |
| `P` | plateforme mobile, seule sa colonne d'ancrage porte à coup sûr |

Une piste, c'est aussi une palette, une fonction `decor()` qui pose les props
le long du bas-côté, et une fonction `pattern()` qui joue la musique croche
par croche sur le banc de voix de `synth.js`.

## Vérifier

```bash
npm run validate
```

Le validateur refuse les lignes mal dimensionnées et vérifie qu'il existe un
chemin où la bille ne se déplace jamais de plus d'une colonne par ligne, sauts
compris, en tenant compte des faisceaux et des pistons.

Passer le validateur ne prouve pas qu'une piste se joue : pour ça il y a un
pilote automatique. Sur la page ouverte avec `?debug` :

```js
await window.__sillon.autoplay()
```

Il calcule le chemin le plus central puis joue chaque piste image par image
avec une horloge simulée, et renvoie la progression, la cause de mort et le
compte de diamants. Son modèle de joueur anticipe d'une ligne mais ne revient
jamais sur une colonne encore dangereuse : sans cette seconde règle il coupe
les angles et meurt là où un humain passe.

Les cinq pistes du disque terminent à 100 % avec ce pilote.

## Organisation

| Fichier | Rôle |
| --- | --- |
| `src/config.js` | géométrie, et tempo vers vitesse de défilement |
| `src/levelkit.js` | vocabulaire des cartes, composition, validateur |
| `src/tracks/*.js` | une piste : carte, palette, décor, motif musical |
| `src/synth.js` | banc de voix WebAudio et séquenceur, horloge maîtresse |
| `src/world.js` | scène three.js, obstacles animés, caméra |
| `src/game.js` | états, collisions, checkpoints, progression |
| `src/autoplay.js` | pilote automatique de vérification |
| `src/input.js` | glissé tactile, clavier de secours |
| `src/ui.js` | pochette, fiche de piste, bandeau de lecture |
| `src/save.js` | progression locale, une entrée par piste |

## Notes de conception

La géométrie est fusionnée par matériau : chaque piste tient en quelques
maillages (sol, néons, décor) plus des instances pour les diamants, les
couronnes, les pistons et les faisceaux. L'ombre de la bille est un disque
plaqué au sol plutôt qu'une ombre portée, pour tenir le taux d'images.

Trois réglages non intuitifs, tous issus de tests :

- la profondeur de collision d'un bloc est bridée sous une demi-ligne, sinon
  deux obstacles proches se recouvrent et ne laissent aucun couloir latéral ;
- les obstacles mobiles ont une période longue, parce que la bille reste un
  temps non négligeable dans la zone de collision d'une ligne : un va-et-vient
  rapide ne laisserait aucun côté sûr au moment du passage ;
- le validateur ne considère comme sûre que la colonne d'ancrage d'une
  plateforme, alors que le jeu, lui, porte la bille sur toute sa largeur : le
  chemin garanti est volontairement plus strict que le jeu réel.

La direction artistique est celle d'une pochette de disque imprimée : titre en
grotesque condensée, métadonnées en machine à écrire, encre crème sur carton.
La couleur d'accent de l'interface est injectée par le jeu et change avec la
piste en cours.
