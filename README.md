# MyLayer

Le site public de commande. Correspond aux sections 0 à 4 du document maître.

```
mylayer/
├── index.html              → la page MyLayer (sections 4.1 à 4.8)
├── assets/
│   ├── css/style.css       → identité « Ardoise » (§3)
│   └── js/main.js          → apparitions au scroll + compteurs
├── formulaire/             → partie 1 du formulaire  (§5)   — à construire
├── fichiers/               → partie 2, dépôt de fichiers (§5.4) — à construire
└── <prenom>/               → une fiche client par dossier (§7) — à venir
```

Site statique, aucune dépendance, aucun build. On ouvre `index.html`, ça marche.
Déploiement Netlify : dossier `mylayer/` à la racine du dépôt, pas de commande de
build, répertoire de publication = la racine.

---

## Ce qui reste à brancher

**1. Le bouton « Commencer » pointe vers `formulaire/`, qui n’existe pas encore.**
Trois occurrences dans `index.html` (accroche, prix, appel final). Elles renverront
un 404 tant que la partie 5 n’est pas construite.

**2. Les visuels de cartes de visite sont des placeholders.**
Section « Ce que ça coûte », bloc `.cartes-visu`. Format déjà au bon ratio
(89 × 50 mm). Pour les remplacer :

- exporter les cartes depuis Canva en PNG ou JPG,
- les déposer dans `assets/img/`,
- dans chaque `<figure>`, remplacer
  `<div class="cv-frame" role="img" aria-label="…"></div>`
  par `<img class="cv-frame" src="assets/img/carte-recto.png" alt="…">`,
- retirer la classe `est-en-attente` sur `.cartes-visu` (elle affiche la mention
  « Visuel à venir »).

Tant que les visuels ne sont pas prêts, il vaut mieux masquer tout le bloc
`.cartes-visu` en production plutôt que de montrer des cadres vides.

**3. Les liens « Voir un exemple » et « Voir une fiche en entier » ne sont pas là.**
Prévus par §4.1 et §4.4, volontairement omis tant qu’aucune fiche n’est en ligne.
À rajouter dès que `mylayer.netlify.app/adrien` existe.

---

## Le contenu des extraits (§4.4)

Trois extraits, dans trois couleurs, **sans aucun nom affiché** — §4 interdit de
faire apparaître le nom d’Adrien, et faire signer trois extraits par la même
personne contredirait « trois fiches différentes ».

| Extrait | Couleur | Source |
|---|---|---|
| Les chiffres | cobalt `#3B4DD4` | **Réel** — repris du profil d’Adrien (16 pays, 400 personnes en banquet, 4 voyages solo, 4 langues) |
| Le parcours | terre `#B85A38` | **Inventé** — profil crédible, à remplacer par du vrai dès le premier client |
| En trois mots | forêt `#2F6B54` | **Inventé** — montre l’écart entre Q7 et Q8 du formulaire, ce qui est le plus parlant |

Le dernier item de la timeline est volontairement estompé : c’est un extrait, pas
une fiche. Voir la règle absolue de §4.4 — ne jamais montrer une fiche entière ici.

---

## Décisions techniques

**Rien n’est jamais masqué durablement.** La classe `js` est posée en ligne dans
`<head>`, et c’est elle seule qui active `opacity: 0` sur les blocs à révéler.
Sans JavaScript, la page s’affiche entière. Si le script plante, `toutAfficher()`
prend le relais. Même chose avec `prefers-reduced-motion`.

**Les chiffres sont écrits en dur dans le HTML** (`16`, `400`…), pas à `0`.
Le compteur les remet à zéro juste avant d’animer. Sans JS, on lit les vraies
valeurs au lieu de quatre zéros.

**Une seule largeur de page sur desktop** (900 px) : tout s’aligne sur le même
bord gauche, du logo au pied de page. La longueur de lecture est bridée bloc par
bloc en `em`, jamais par le conteneur.

**Une animation par bloc** (§7.5) : les chiffres montent, la timeline se dessine,
les mots apparaissent en cascade. Jamais deux effets sur le même bloc.

---

## Lancer en local

```
npx serve . -p 4711
```

Ou, depuis Claude Code, la configuration `mylayer` de `.claude/launch.json`.
