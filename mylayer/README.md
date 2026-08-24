# MyLayer

Page publique de commande. Suit le **document de correction v2**, qui remplace
les sections 3 et 4 du document maître.

```
mylayer/
├── index.html                  → l’accueil ET le questionnaire, un seul scroll
├── formulaire/fichiers/        → le dépôt des photos, volontairement à part
├── assets/
│   ├── css/style.css           → identité vert sapin, Anton + Inter
│   ├── css/formulaire.css      → les objets du questionnaire et du dépôt
│   ├── js/main.js              → scroll, téléphone, trois premières questions, couleur
│   ├── js/formulaire.js        → le moteur du questionnaire
│   ├── js/fichiers.js          → compression et envoi des photos
│   └── js/pays.js              → les 212 pays
└── <prenom>/                   → une page client par dossier, à venir
```

Statique, sans dépendance ni build. Déploiement Netlify : publier ce dossier.

**Le questionnaire vit dans `index.html`.** Les trois premières questions (prénom,
âge, couleur) sont suivies sans rupture par le reste : même page, même scroll,
aucun chargement. Le prénom, l’âge et la couleur transitent par `localStorage`
sous la clé `mylayer.debut`, et sont relus **à l’envoi**, pas au chargement :
ils ne sont pas encore répondus quand la page s’ouvre.

**Le dépôt de photos reste une page séparée**, et ce n’est pas un détail : une
soumission trop lourde échoue en bloc. Si les réponses écrites étaient dedans,
dix minutes de saisie partiraient avec. Le pire qui puisse arriver, ici, est de
redéposer des photos.

---

## Les deux formulaires Netlify

| Formulaire | Où | Champs |
|---|---|---|
| `mylayer-reponses` | `index.html` | 47 champs + 6 emplacements de fichiers joints |
| `mylayer-fichiers` | `formulaire/fichiers/index.html` | 13 emplacements de photos |

Netlify les détecte **au déploiement, en lisant le HTML**. Tout champ qui doit
remonter existe donc en dur dans la page, `name` compris, même s’il est rempli
par le JS. C’est pourquoi les emplacements de fichiers sont déclarés dans un
`<div hidden data-emplacements>` : les zones de dépôt visibles ne sont que
l’interface, et le corps envoyé reçoit les versions allégées à leur place.

Toucher au `name` du formulaire, à `data-netlify`, au champ caché `form-name` ou
au `name` d’un champ suffit à faire disparaître les réponses **sans erreur
visible**. C’est le point le plus fragile du projet.

---

## L’identité

Même famille que `profiladrienredolat.netlify.app`, valeurs reprises de son CSS :
Anton en capitales géantes, Inter en corps, fond en couleur pleine avec
`radial-gradient(120% 80% at 70% 0%)`, traits blancs, apparitions en
`translateY(28px)` sur `cubic-bezier(.2,.65,.3,1)`.

**Le vert sapin remplace le cobalt** pour ne pas confondre la marque et son
créateur, même intensité, autre bout de la roue chromatique.

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
| Accroche pleine couleur, CV en lettres creuses / page pleine | §1 |
| Page qui défile dans un téléphone au scroll de la page | Exemple Léa |
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

**3. Le choix de la police par le client.** Prévu, pas encore fait : la
typographie ne bouge pas pour l’instant.

**4. Les pages d’exemple sont inventées.** Léa et Sami n’existent pas. À
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
python3 -m http.server 4711
```

**Attention à la prévisualisation intégrée :** si l’onglet est en arrière-plan,
`document.visibilityState` vaut `hidden`, les transitions CSS ne progressent pas
et `requestAnimationFrame` ne se déclenche jamais. La page paraît alors vide et
les captures sortent blanches, alors que tout va bien. Toujours juger dans un
onglet au premier plan.
