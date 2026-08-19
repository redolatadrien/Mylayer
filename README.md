# MyLayer

Page publique de commande. Suit le **document de correction v2**, qui remplace
les sections 3 et 4 du document maître.

```
mylayer/
├── index.html          → la page (carte du monde incluse en dur, ~88 Ko)
├── assets/
│   ├── css/style.css   → identité vert sapin, Anton + Inter
│   └── js/main.js      → scroll, compteurs, carte, téléphone, couleur, carte de visite
├── formulaire/         → §5 du document maître — à construire
└── <prenom>/           → une fiche client par dossier — à venir
```

Statique, sans dépendance ni build. Déploiement Netlify : publier ce dossier.

---

## L’identité

Même famille que `profiladrienredolat.netlify.app`, valeurs reprises de son CSS :
Anton en capitales géantes, Inter en corps, fond en couleur pleine avec
`radial-gradient(120% 80% at 70% 0%)`, traits blancs, apparitions en
`translateY(28px)` sur `cubic-bezier(.2,.65,.3,1)`.

**Le vert sapin remplace le cobalt** pour ne pas confondre la marque et son
créateur — même intensité, autre bout de la roue chromatique.

| Rôle | Valeur |
|---|---|
| Dominante | `#0F5C46` |
| Profondeur | `#0A4536` |
| Accent haut de page | `#176E54` |
| Fond clair alterné | `#F4F1EA` |
| Encre sur fond clair | `#14201C` |

Les couleurs sont déclarées en `@property`, ce qui les rend **animables** :
c’est ce qui permet à la page de se repeindre quand le visiteur choisit sa
couleur. Navigateur trop ancien : la couleur change d’un coup, sans transition.

---

## Les moments « whow » en place

| Moment | Où |
|---|---|
| Accroche pleine couleur, CV en lettres creuses / fiche pleine | §1 |
| Fiche qui défile dans un téléphone au scroll de la page | Exemple Léa |
| Carte du monde qui se remplit pays par pays | Exemple Sami |
| Compteurs qui montent | Exemple Sami |
| Timeline qui se dessine | Exemple Léa |
| **La couleur choisie repeint toute la page** | §5 |
| Carte de visite qui se retourne | §6 |

Une animation majeure par section, jamais deux.

---

## Ce qui reste à faire

**1. Les photos.** Tous les emplacements sont des cadres au trait blanc portant
leur légende (`data-file`). Pour poser une image : remplacer
`<div class="frame frame--empty" data-file="…">` par
`<img class="frame" src="assets/img/…" alt="…">`.

**2. Les visuels de cartes de visite.** La carte 3D a le bon format (89 × 50 mm)
mais ses deux faces sont vides. Remplacer le contenu de `.carte-face` par des
`<img>`, puis retirer la classe `est-en-attente` sur `.cartes`.

**3. Le formulaire.** « Continuer » et « reprendre » pointent vers `formulaire/`,
qui n’existe pas encore → 404. Les trois premières questions (prénom, âge,
couleur) vivent déjà dans la page et sont gardées en `localStorage` sous la clé
`mylayer.debut` ; le formulaire devra les relire pour ne pas les redemander.

**4. Les fiches d’exemple sont inventées.** Léa et Sami n’existent pas. À
remplacer par de vrais clients dès les premiers. Aucun nom d’Adrien n’apparaît
nulle part, conformément au document maître.

---

## Attribution

La carte du monde vient du profil d’Adrien : *Simple World Map*, Al MacDonald /
Fritz Lekschas, **CC BY-SA 3.0**. Identifiants ISO 3166-1. Le crédit doit
figurer quelque part si la page est diffusée largement.

Hong Kong est fondu dans la Chine sur cette carte : les 16 pays allumés sont
choisis parmi ceux qui ont réellement un tracé, pour que le compteur et la carte
disent la même chose.

---

## Vérifier en local

```
npx serve . -p 4711
```

**Attention à la prévisualisation intégrée :** si l’onglet est en arrière-plan,
`document.visibilityState` vaut `hidden`, les transitions CSS ne progressent pas
et `requestAnimationFrame` ne se déclenche jamais. La page paraît alors vide et
les captures sortent blanches, alors que tout va bien. Toujours juger dans un
onglet au premier plan.
