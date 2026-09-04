/* ==========================================================================
   MyLayer, le questionnaire
   --------------------------------------------------------------------------
   1. Ce que les premières questions ont donné (prénom, âge, couleur, police)
   2. Les questions construites en JS : les mots, les répéteurs, les langues,
      les pays
   3. Les gestes : choix, duels, classement, champs multiples, répéteurs
   4. La navigation d’un écran à l’autre, dans les deux sens
   5. La sauvegarde locale, en continu
   6. L’envoi, et la référence qui rattachera les photos

   Le questionnaire vit maintenant dans la page d’accueil : le prénom, l’âge et
   la couleur sont posés juste au-dessus, dans le même document. On ne les relit
   donc plus au chargement, ils n’existent pas encore, mais à l’envoi.

   Principe qui traverse tout le fichier : une réponse écrite ne doit jamais
   pouvoir être perdue. Elle est gardée sur le téléphone à chaque frappe, et
   elle y reste même après un envoi réussi.
   ========================================================================== */

(function () {
  'use strict';

  var CLE_DEBUT    = 'mylayer.debut';       /* écrite par la page d’accueil */
  var CLE          = 'mylayer.formulaire';
  /* Le drapeau du parcours. Tant qu’il est là, l’accueil ne touche à rien
     de ce qui est gardé sur l’appareil ; sans lui, il fait table rase à
     chaque chargement. Il est posé au premier écran validé, retiré après
     un envoi réussi. */
  var CLE_PARCOURS = 'mylayer.parcours';

  function marquerLeParcours() {
    try { localStorage.setItem(CLE_PARCOURS, '1'); } catch (e) { /* tant pis */ }
  }
  function oublierLeParcours() {
    try { localStorage.removeItem(CLE_PARCOURS); } catch (e) { /* tant pis */ }
  }

  var form = document.getElementById('formulaire');
  if (!form) return;

  /* ======================================================================
     La mémoire
     ====================================================================== */
  function lire(cle) {
    try { return JSON.parse(localStorage.getItem(cle) || '{}'); }
    catch (e) { return {}; }
  }

  var rep = lire(CLE);

  var enAttente = null;
  function garder(champ, valeur) {
    rep[champ] = valeur;
    /* On écrit groupé : une frappe de clavier ne déclenche pas une écriture
       disque à elle seule, mais rien n’attend plus de 400 ms. */
    if (enAttente) clearTimeout(enAttente);
    enAttente = setTimeout(ecrire, 400);
  }
  function ecrire() {
    enAttente = null;
    try { localStorage.setItem(CLE, JSON.stringify(rep)); }
    catch (e) { /* navigation privée : on n’insiste pas */ }
  }

  /* ======================================================================
     1. Ce que la page d’accueil a déjà donné
     Le prénom, l’âge et la couleur ne sont jamais redemandés. La couleur
     repeint aussi cette page : le parcours ne doit pas changer d’allure
     entre l’accueil et les questions.
     ====================================================================== */
  var COULEURS = {
    '#0F5C46': 'Vert sapin',
    '#3B4DD4': 'Bleu cobalt',
    '#B8432A': 'Terracotta',
    '#5A2A6E': 'Prune',
    '#B5122E': 'Rouge profond',
    '#1F3A5F': 'Bleu nuit',
    '#8A6A12': 'Ocre',
    '#1A1A1A': 'Encre',
    '#96206E': 'Rose profond',
    '#0B5F69': 'Turquoise sombre'
  };

  /* Les trois premières questions sont juste au-dessus, dans la même page :
     elles ne sont pas encore répondues au chargement. On va les chercher à
     l’envoi, au dernier moment, quand elles sont sûres d’être écrites. Le
     repeignage de la page, lui, appartient à main.js : il se fait en direct,
     le questionnaire n’a plus à s’en occuper. */
  function reprendreLeDebut() {
    var debut = lire(CLE_DEBUT);
    /* Recopiés sans condition : un champ vidé doit vider la réponse, sinon
       un prénom effacé continuerait de partir avec l’envoi. */
    rep.prenom = debut.prenom || '';
    rep.nom    = debut.nom    || '';
    if (debut.age)    rep.age    = String(debut.age);
    /* La police part sous son nom exact : il sera recopié tel quel dans le
       gabarit. Rien de choisi, et c’est le champ caché qui garde sa valeur. */
    if (debut.police) rep.police = debut.police;
    if (debut.couleur) {
      var t = String(debut.couleur).split(',');
      var nom = COULEURS[t[0].toUpperCase()] || 'sur mesure';
      rep.couleur = nom + ' (' + t[0] + ')';
    }
    ecrire();
  }

  /* ======================================================================
     2. Les questions construites en JS
     ====================================================================== */

  /* ---------- les cinq mots ----------
     Cinq familles, aucun mot faible, aucun jugement de valeur.

     La règle a changé : ce n’est plus « trois minimum parmi vingt-cinq », une
     consigne qui obligeait à compter et que personne ne comprenait du premier
     coup. C’est un mot par ligne, cinq lignes. L’interaction se résout
     d’elle-même : cliquer un mot désélectionne l’autre mot de sa ligne, et
     on ne peut pas se tromper. Rien n’est obligatoire pour autant, sauter la
     question reste un chemin normal. */
  var MOTS = [
    ['Rapport aux autres',  ['Sociable', 'Discret', 'Attentif', 'Direct', 'Diplomate']],
    ['Rapport à l’action',  ['Rapide', 'Méthodique', 'Débrouillard', 'Persévérant', 'Spontané']],
    ['Rapport aux idées',   ['Curieux', 'Créatif', 'Pragmatique', 'Rêveur', 'Observateur']],
    ['Tempérament',         ['Calme', 'Énergique', 'Drôle', 'Sérieux', 'Indépendant']],
    ['Engagement',          ['Fiable', 'Généreux', 'Exigeant', 'Adaptable', 'Passionné']]
  ];

  function construireMots(hote) {
    var cible = hote.getAttribute('data-mots');
    var jauge = document.querySelector('[data-jauge-mots="' + cible + '"]');

    /* Un mot retenu par famille, jamais deux. Ce qui a été gardé est
       redistribué dans sa ligne d’origine : l’ordre de sortie suit donc
       toujours l’ordre des familles, quel que soit l’ordre des clics. */
    var gardes = (rep[cible] || '').split(', ').filter(Boolean);
    var retenus = MOTS.map(function (fam) {
      for (var i = 0; i < gardes.length; i++) {
        if (fam[1].indexOf(gardes[i]) > -1) return gardes[i];
      }
      return '';
    });

    MOTS.forEach(function (fam, rangIndex) {
      var bloc = document.createElement('div');
      bloc.className = 'famille';
      var titre = document.createElement('p');
      titre.className = 'famille__nom';
      titre.textContent = fam[0];
      bloc.appendChild(titre);

      var rangee = document.createElement('div');
      rangee.className = 'choix';
      rangee.setAttribute('role', 'radiogroup');
      rangee.setAttribute('aria-label', fam[0]);

      fam[1].forEach(function (mot) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'choix__opt';
        b.textContent = mot;
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', retenus[rangIndex] === mot ? 'true' : 'false');
        b.addEventListener('click', function () { choisirMot(rangee, rangIndex, mot); });
        rangee.appendChild(b);
      });
      bloc.appendChild(rangee);
      hote.appendChild(bloc);
    });

    /* Recliquer le mot déjà retenu le retire : sans ça, une ligne cochée par
       erreur ne pourrait plus être vidée. */
    function choisirMot(rangee, rangIndex, mot) {
      retenus[rangIndex] = (retenus[rangIndex] === mot) ? '' : mot;
      var opts = rangee.querySelectorAll('.choix__opt');
      for (var i = 0; i < opts.length; i++) {
        opts[i].setAttribute('aria-checked',
          opts[i].textContent === retenus[rangIndex] ? 'true' : 'false');
      }
      garder(cible, retenus.filter(Boolean).join(', '));
      majJauge();
    }

    function majJauge() {
      if (!jauge) return;
      var n = retenus.filter(Boolean).length;
      var plein = (n === MOTS.length);
      jauge.textContent = plein ? 'c’est bon'
                                : n + (n > 1 ? ' lignes' : ' ligne') + ' sur ' + MOTS.length;
      jauge.classList.toggle('est-plein', plein);
    }
    majJauge();
  }

  var hotesMots = document.querySelectorAll('[data-mots]');
  for (var m = 0; m < hotesMots.length; m++) construireMots(hotesMots[m]);

  /* ---------- les langues ----------
     Une langue cochée fait apparaître son niveau : demander le niveau de
     douze langues d’un coup ferait un mur de menus déroulants. */
  var LANGUES = ['Français', 'Anglais', 'Allemand', 'Suisse allemand', 'Italien',
                 'Espagnol', 'Portugais', 'Albanais', 'Arabe', 'Serbo-croate',
                 'Turc', 'Russe'];
  var NIVEAUX = ['notions', 'je me débrouille', 'courant', 'bilingue', 'langue maternelle'];

  (function construireLangues() {
    var hote = document.querySelector('[data-langues]');
    if (!hote) return;

    /* « Français (courant), Anglais (notions) » → { Français: 'courant', … } */
    var etat = {};
    (rep.langues || '').split(', ').filter(Boolean).forEach(function (bout) {
      var o = bout.indexOf(' (');
      if (o > -1) etat[bout.slice(0, o)] = bout.slice(o + 2, -1);
      else etat[bout] = NIVEAUX[2];
    });

    LANGUES.forEach(function (langue) {
      var ligne = document.createElement('div');
      ligne.className = 'langue';

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'choix__opt';
      b.textContent = langue;
      b.setAttribute('aria-pressed', etat[langue] ? 'true' : 'false');

      var niv = document.createElement('select');
      niv.className = 'langue__niveau';
      niv.setAttribute('aria-label', 'niveau en ' + langue);
      NIVEAUX.forEach(function (n) {
        var o = document.createElement('option');
        o.value = n; o.textContent = n;
        niv.appendChild(o);
      });
      niv.value = etat[langue] || NIVEAUX[2];
      niv.hidden = !etat[langue];

      b.addEventListener('click', function () {
        if (etat[langue]) { delete etat[langue]; niv.hidden = true; }
        else { etat[langue] = niv.value; niv.hidden = false; }
        b.setAttribute('aria-pressed', etat[langue] ? 'true' : 'false');
        majLangues();
      });
      niv.addEventListener('change', function () {
        etat[langue] = niv.value;
        majLangues();
      });

      ligne.appendChild(b);
      ligne.appendChild(niv);
      hote.appendChild(ligne);
    });

    function majLangues() {
      var sortie = LANGUES.filter(function (l) { return etat[l]; })
                          .map(function (l) { return l + ' (' + etat[l] + ')'; });
      garder('langues', sortie.join(', '));
    }
  })();

  /* ---------- les pays ----------
     Deux cent douze cases ne se parcourent pas au pouce : on tape trois
     lettres. Les pays déjà cochés restent visibles au-dessus de la liste,
     sinon on perd de vue ce qu’on a mis. */
  /* ---------- les lieux cochés : les pays, ou les régions ----------
     Le même composant sert deux fois. Celui qui a voyagé coche des pays,
     celui qui n’a pas voyagé coche des régions : le gabarit a une carte pour
     chacun, et « non » ne doit plus mener à un écran mort.

     Les pays portent leur code ISO, les régions n’en ont pas : il n’existe
     pas de norme qui couvre à la fois un canton, un département français et
     l’Oberland bernois. L’identité est donc le code s’il existe, le nom
     sinon, et c’est la seule différence entre les deux listes. */
  var LIEUX = {
    pays:    function () { return window.MYLAYER_PAYS; },
    regions: function () { return window.MYLAYER_REGIONS; }
  };

  /* Chaque bloc dépose ici de quoi se vider. Basculer de « oui » à « non »
     doit effacer la liste qu’on referme, sinon des pays cochés partiraient
     avec la réponse « je n’ai pas voyagé ». */
  var videLesLieux = {};

  function construireLieux(bloc) {
    var quoi   = bloc.getAttribute('data-lieux');
    var cible  = bloc.getAttribute('data-cible');
    var source = LIEUX[quoi] && LIEUX[quoi]();
    if (!source) return;

    var liste       = bloc.querySelector('[data-lieux-liste]');
    var hoteChoisis = bloc.querySelector('[data-lieux-choisis]');
    var cherche     = bloc.querySelector('[data-lieux-cherche]');
    if (!liste) return;

    function cle(p) { return p.code || p.nom; }
    function etiquette(p) { return p.code ? p.nom + ' (' + p.code + ')' : p.nom; }

    /* « Thaïlande (TH), Canada (CA) » → ['TH', 'CA'] · « Vaud, Valais » →
       ['Vaud', 'Valais']. On relit ce qu’on a écrit, dans les deux formes. */
    var choisis = (rep[cible] || '').split(', ').filter(Boolean).map(function (b) {
      var o = b.lastIndexOf(' (');
      return o > -1 ? b.slice(o + 2, -1) : b;
    });

    function sansAccent(s) {
      return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function dessiner() {
      var q = sansAccent((cherche && cherche.value || '').trim());
      liste.textContent = '';

      var vus = source.filter(function (p) {
        return !q || sansAccent(p.nom).indexOf(q) > -1;
      });

      if (!vus.length) {
        var vide = document.createElement('p');
        vide.className = 'pays__vide';
        vide.textContent = 'Rien à ce nom. Le champ juste en dessous est là pour ça.';
        liste.appendChild(vide);
        return;
      }

      vus.forEach(function (p) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pays__opt';
        b.textContent = p.nom;
        b.setAttribute('aria-pressed', choisis.indexOf(cle(p)) > -1 ? 'true' : 'false');
        b.addEventListener('click', function () {
          var i = choisis.indexOf(cle(p));
          if (i > -1) choisis.splice(i, 1); else choisis.push(cle(p));
          b.setAttribute('aria-pressed', i > -1 ? 'false' : 'true');
          majLieux();
        });
        liste.appendChild(b);
      });
    }

    function majLieux() {
      /* Pour les pays, on garde les noms ET les codes : le nom pour se
         relire, le code pour qu’une carte s’allume plus tard sans re-deviner
         les intitulés. Les régions n’ont que leur nom. */
      var sortie = choisis.map(function (k) {
        var p = source.filter(function (x) { return cle(x) === k; })[0];
        return p ? etiquette(p) : k;
      });
      garder(cible, sortie.join(', '));

      if (hoteChoisis) {
        hoteChoisis.textContent = '';
        sortie.forEach(function (nom, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'choix__opt';
          b.setAttribute('aria-pressed', 'true');
          b.textContent = nom.replace(/ \([A-Z]{2}\)$/, '') + ' ×';
          b.setAttribute('aria-label', 'retirer ' + nom);
          b.addEventListener('click', function () {
            choisis.splice(i, 1);
            majLieux(); dessiner();
          });
          hoteChoisis.appendChild(b);
        });
      }
    }

    videLesLieux[bloc.getAttribute('data-bloc')] = function () {
      if (!choisis.length) return;
      choisis.length = 0;
      if (cherche) cherche.value = '';
      majLieux(); dessiner();
    };

    if (cherche) cherche.addEventListener('input', dessiner);
    dessiner(); majLieux();
  }

  var blocsLieux = document.querySelectorAll('[data-lieux]');
  for (var bl = 0; bl < blocsLieux.length; bl++) construireLieux(blocsLieux[bl]);

  /* ---------- les portes de sortie, à plusieurs entrées ----------
     Une seule ligne obligeait à choisir entre deux mots, deux langues, deux
     endroits. On ajoute des lignes autant qu’on veut ; elles se rassemblent
     dans le champ caché qui porte le nom d’origine, séparées par des virgules,
     comme les listes cochées juste au-dessus. */
  function construireMulti(hote) {
    var cible   = hote.getAttribute('data-multi');
    var gabarit = hote.getAttribute('data-gabarit') || '';
    var long    = parseInt(hote.getAttribute('data-long'), 10) || 120;

    var etiquette = document.getElementById(hote.getAttribute('aria-labelledby') || '');
    var nom = etiquette ? etiquette.textContent.trim() : '';

    function lignes() {
      return [].slice.call(hote.querySelectorAll('.multi__champ'));
    }
    function enregistrer() {
      garder(cible, lignes().map(function (ch) { return ch.value.trim(); })
                            .filter(Boolean).join(', '));
    }
    /* La croix ne s’affiche qu’à partir de la deuxième ligne : sur une ligne
       seule, elle proposerait de retirer un champ vide. */
    function majCroix() {
      var tout = [].slice.call(hote.querySelectorAll('.multi__retirer'));
      tout.forEach(function (b) { b.hidden = (tout.length < 2); });
    }

    var ajout = document.createElement('button');
    ajout.type = 'button';
    ajout.className = 'multi__ajouter';
    ajout.textContent = '+ ajouter';
    ajout.addEventListener('click', function () { ajouterLigne('', true); });

    function ajouterLigne(valeur, prendreLeCurseur) {
      var ligne = document.createElement('div');
      ligne.className = 'multi__ligne';

      var champ = document.createElement('input');
      champ.type = 'text';
      champ.className = 'sortie__champ multi__champ';
      champ.placeholder = gabarit;
      champ.maxLength = long;
      champ.autocomplete = 'off';
      champ.value = valeur || '';
      if (nom) champ.setAttribute('aria-label', nom);
      champ.addEventListener('input', enregistrer);

      var retirer = document.createElement('button');
      retirer.type = 'button';
      retirer.className = 'multi__retirer';
      retirer.innerHTML = '&times;';
      retirer.setAttribute('aria-label', 'retirer cette ligne');
      retirer.addEventListener('click', function () {
        ligne.parentNode.removeChild(ligne);
        if (!lignes().length) ajouterLigne('', false);
        majCroix();
        enregistrer();
      });

      ligne.appendChild(champ);
      ligne.appendChild(retirer);
      hote.insertBefore(ligne, ajout);
      majCroix();
      if (prendreLeCurseur) champ.focus();
    }

    hote.appendChild(ajout);
    var gardees = (rep[cible] || '').split(', ').filter(Boolean);
    if (!gardees.length) gardees = [''];
    gardees.forEach(function (v) { ajouterLigne(v, false); });
  }

  var multis = document.querySelectorAll('[data-multi]');
  for (var mm = 0; mm < multis.length; mm++) construireMulti(multis[mm]);

  /* ---------- les répéteurs ----------
     Deux blocs du gabarit attendent des cases, pas un récit : le PARCOURS
     veut un intitulé, un lieu, une année, un détail chiffré ; les CHIFFRES
     veulent un entier et deux mots de légende. Un textarea rendait des
     paragraphes qu’il fallait ensuite découper à la main.

     Les colonnes sont décrites ici, une seule fois, comme les mots et les
     langues. Les champs d’une ligne n’ont pas de « name » : c’est le champ
     caché de la question qui part chez Netlify, une ligne par étape, les
     colonnes séparées par une barre verticale. */
  var REPETEURS = {
    parcours: {
      depart: 2, max: 5, ajouter: '+ une étape', retirer: 'retirer cette étape',
      champs: [
        { label: 'Tu faisais quoi',           gabarit: 'Serveuse',                 long: 80 },
        { label: 'Où',                        gabarit: 'Café du Grütli, Lausanne', long: 80 },
        { label: 'Quand',                     gabarit: '2019–2021',                long: 30 },
        { label: 'Un chiffre, si tu en as un', gabarit: '80 couverts par service', long: 60,
          aide: 'Une quantité, une taille d’équipe, une durée. C’est ce qui rend une étape crédible.' }
      ]
    },
    /* Deux familles, ni plus ni moins : le bloc du gabarit n’en affiche pas
       davantage, et un bouton d’ajout promettrait une place qui n’existe pas.
       Ni ajout ni croix, donc, d’où « fixe ». Les exemples changent d’une
       ligne à l’autre : deux fois « Cuisine » aurait laissé croire qu’on
       attend deux fois la même chose. */
    competences: {
      depart: 2, max: 2, fixe: true,
      champs: [
        { label: 'La famille',          gabarit: ['Cuisine', 'Administratif'], long: 24 },
        { label: 'Ce qu’il y a dedans',
          gabarit: ['Pâtisserie, service en salle, gestion des commandes',
                    'Excel, caisse, plannings'], long: 120,
          aide: 'Sépare-les par des virgules, c’est comme ça qu’elles s’afficheront.' }
      ]
    },
    chiffres: {
      depart: 2, max: 4, ajouter: '+ un chiffre', retirer: 'retirer ce chiffre',
      champs: [
        { label: 'Le nombre', gabarit: '16', long: 9, numerique: true,
          aide: 'Un nombre entier. Sans texte.' },
        /* Vingt-quatre signes : au-delà, la légende passe sur deux lignes et
           casse la grille du bloc CHIFFRES. */
        { label: 'De quoi',   gabarit: 'pays visités', long: 24 }
      ]
    }
  };

  function construireRepeteur(hote) {
    var cible = hote.getAttribute('data-repeteur');
    var reg   = REPETEURS[cible];
    if (!reg) return;

    var corps = document.createElement('div');
    corps.className = 'repet__lignes';
    hote.appendChild(corps);

    var ajout = document.createElement('button');
    ajout.type = 'button';
    ajout.className = 'multi__ajouter';
    ajout.textContent = reg.ajouter || '';
    ajout.addEventListener('click', function () { ajouterLigne(null, true); });
    if (!reg.fixe) hote.appendChild(ajout);

    function lignes() {
      return [].slice.call(corps.querySelectorAll('.repet__ligne'));
    }

    /* Une ligne entièrement vide ne part pas : ajouter trois étapes puis
       n’en remplir qu’une ne doit pas envoyer deux lignes de barres. */
    function enregistrer() {
      var sortie = lignes().map(function (ligne) {
        var vals = [].slice.call(ligne.querySelectorAll('.repet__champ'))
                     .map(function (ch) { return ch.value.trim(); });
        if (!vals.join('')) return '';
        return vals.join(' | ').replace(/\s+$/, '');
      }).filter(Boolean);
      garder(cible, sortie.join('\n'));
    }

    /* La croix n’apparaît qu’à partir de la deuxième ligne : sur une ligne
       seule, elle proposerait de retirer un champ vide. */
    function majEtat() {
      var tout = lignes();
      tout.forEach(function (ligne, i) {
        var croix = ligne.querySelector('.repet__retirer');
        if (croix) croix.hidden = reg.fixe || (i === 0 || tout.length < 2);
        var num = ligne.querySelector('.repet__num');
        if (num) num.textContent = (i + 1);
      });
      ajout.hidden = (tout.length >= reg.max);
    }

    function ajouterLigne(valeurs, prendreLeCurseur) {
      var ligne = document.createElement('div');
      ligne.className = 'repet__ligne';

      var num = document.createElement('span');
      num.className = 'repet__num';
      ligne.appendChild(num);

      var cases = document.createElement('div');
      cases.className = 'repet__cases';

      reg.champs.forEach(function (spec, k) {
        var part = document.createElement('div');
        part.className = 'repet__case';

        var champ = document.createElement('input');
        champ.type = 'text';
        champ.className = 'sortie__champ repet__champ';
        /* Un exemple par ligne quand le registre en donne plusieurs : répéter
           « Cuisine » sur les deux lignes ferait croire qu’on attend deux fois
           la même famille. */
        champ.placeholder = Array.isArray(spec.gabarit)
          ? (spec.gabarit[lignes().length] || spec.gabarit[spec.gabarit.length - 1])
          : spec.gabarit;
        champ.maxLength = spec.long;
        champ.autocomplete = 'off';
        champ.setAttribute('aria-label', spec.label);
        if (spec.numerique) {
          champ.inputMode = 'numeric';
          champ.pattern = '[0-9]*';
        }
        champ.value = (valeurs && valeurs[k]) || '';
        champ.addEventListener('input', enregistrer);

        var lab = document.createElement('span');
        lab.className = 'repet__label';
        lab.textContent = spec.label;

        part.appendChild(lab);
        part.appendChild(champ);

        /* Le sous-titre ne se répète pas sur les cinq lignes : il est posé
           sur la première, là où l’œil arrive. */
        if (spec.aide && !lignes().length) {
          var aide = document.createElement('p');
          aide.className = 'repet__aide';
          aide.textContent = spec.aide;
          part.appendChild(aide);
        }

        cases.appendChild(part);
      });
      ligne.appendChild(cases);

      var retirer = document.createElement('button');
      retirer.type = 'button';
      retirer.className = 'multi__retirer repet__retirer';
      retirer.innerHTML = '&times;';
      retirer.setAttribute('aria-label', reg.retirer);
      retirer.addEventListener('click', function () {
        corps.removeChild(ligne);
        if (!lignes().length) ajouterLigne(null, false);
        majEtat();
        enregistrer();
      });
      ligne.appendChild(retirer);

      corps.appendChild(ligne);
      majEtat();
      if (prendreLeCurseur) ligne.querySelector('.repet__champ').focus();
    }

    var gardees = (rep[cible] || '').split('\n').filter(function (l) { return l.trim(); });
    var combien = Math.max(reg.depart, Math.min(gardees.length, reg.max));
    for (var i = 0; i < combien; i++) {
      ajouterLigne(gardees[i] ? gardees[i].split('|').map(function (v) { return v.trim(); }) : null, false);
    }
  }

  var repeteurs = document.querySelectorAll('[data-repeteur]');
  for (var rp = 0; rp < repeteurs.length; rp++) construireRepeteur(repeteurs[rp]);

  /* ======================================================================
     3. Les gestes
     ====================================================================== */

  /* ---------- un seul choix ----------
     Le bouton peut porter une valeur différente de son texte : « on se
     tutoie » se stocke « tutoiement », parce que c’est le mot que le gabarit
     lira, pas la phrase qu’on montre au client. */
  var uniques = document.querySelectorAll('[data-unique]');
  for (var u = 0; u < uniques.length; u++) {
    (function (groupe) {
      var cible = groupe.getAttribute('data-cible');
      var opts = groupe.querySelectorAll('.choix__opt');
      function valeurDe(b) { return b.getAttribute('data-val') || b.textContent; }

      for (var i = 0; i < opts.length; i++) {
        (function (b) {
          if (rep[cible] === valeurDe(b)) b.setAttribute('aria-checked', 'true');
          b.addEventListener('click', function () {
            for (var j = 0; j < opts.length; j++) opts[j].setAttribute('aria-checked', 'false');
            b.setAttribute('aria-checked', 'true');
            garder(cible, valeurDe(b));
            reagir(groupe, valeurDe(b), true);
          });
        })(opts[i]);
      }
      if (rep[cible]) reagir(groupe, rep[cible], false);
    })(uniques[u]);
  }

  /* Une réponse ouvre des blocs dans le même écran, et referme ceux de
     l’autre réponse. C’est le cas du voyage : « oui » ouvre les pays, « non »
     ouvre les régions, et le champ libre reste sous les deux.

     Refermer un bloc de lieux le vide. Sans ça, cocher trois pays puis
     revenir sur « non » enverrait « je n’ai pas voyagé » avec trois pays
     collés au champ caché. On ne vide qu’au clic : au chargement, ce qui est
     gardé sur l’appareil doit être retrouvé tel quel. */
  function reagir(groupe, valeur, depuisLeClic) {
    var oui = groupe.getAttribute('data-ouvre-oui');
    var non = groupe.getAttribute('data-ouvre-non');
    var simple = groupe.getAttribute('data-ouvre');

    if (simple) {
      var b = document.querySelector('[data-bloc="' + simple + '"]');
      if (b) b.hidden = (valeur !== 'oui');
      return;
    }
    if (!oui && !non) return;

    var aOuvrir = (valeur === 'oui' ? oui : valeur === 'non' ? non : '') || '';
    var voulus = aOuvrir.split(',').filter(Boolean);

    var tous = {};
    (oui || '').split(',').filter(Boolean).forEach(function (n) { tous[n] = 1; });
    (non || '').split(',').filter(Boolean).forEach(function (n) { tous[n] = 1; });

    Object.keys(tous).forEach(function (nom) {
      var bloc = document.querySelector('[data-bloc="' + nom + '"]');
      if (!bloc) return;
      var ouvert = voulus.indexOf(nom) > -1;
      bloc.hidden = !ouvert;
      if (!ouvert && depuisLeClic && videLesLieux[nom]) videLesLieux[nom]();
    });
  }

  /* ---------- plusieurs choix ---------- */
  var multiples = document.querySelectorAll('[data-multiple]');
  for (var mu = 0; mu < multiples.length; mu++) {
    (function (groupe) {
      var cible = groupe.getAttribute('data-cible');
      var opts = groupe.querySelectorAll('.choix__opt');
      var pris = (rep[cible] || '').split(', ').filter(Boolean);

      for (var i = 0; i < opts.length; i++) {
        (function (b) {
          if (pris.indexOf(b.textContent) > -1) b.setAttribute('aria-pressed', 'true');
          b.addEventListener('click', function () {
            var k = pris.indexOf(b.textContent);
            if (k > -1) pris.splice(k, 1); else pris.push(b.textContent);
            b.setAttribute('aria-pressed', k > -1 ? 'false' : 'true');
            garder(cible, pris.join(', '));
          });
        })(opts[i]);
      }
    })(multiples[mu]);
  }

  /* ---------- une case à cocher seule (afficher le numéro) ---------- */
  var bascules = document.querySelectorAll('[data-bascule]');
  for (var ba = 0; ba < bascules.length; ba++) {
    (function (groupe) {
      var cible = groupe.getAttribute('data-cible');
      var b = groupe.querySelector('.choix__opt');
      if (!b) return;
      if (rep[cible] === 'oui') b.setAttribute('aria-pressed', 'true');
      b.addEventListener('click', function () {
        var actif = b.getAttribute('aria-pressed') === 'true';
        b.setAttribute('aria-pressed', actif ? 'false' : 'true');
        garder(cible, actif ? 'non' : 'oui');
      });
    })(bascules[ba]);
  }

  /* ---------- les duels ---------- */
  var duels = document.querySelectorAll('[data-duel]');
  for (var d = 0; d < duels.length; d++) {
    (function (groupe) {
      var cible = groupe.getAttribute('data-duel');
      var opts = groupe.querySelectorAll('.duel__opt');

      /* La pastille blanche est portée par le groupe, pas par le bouton :
         c’est ce qui lui permet de glisser d’un côté à l’autre au lieu de
         s’allumer et s’éteindre. */
      function basculer(k) {
        groupe.classList.add('est-choisi');
        groupe.classList.toggle('est-droite', k === 1);
      }

      for (var i = 0; i < opts.length; i++) {
        (function (b, k) {
          if (rep[cible] === b.textContent) {
            b.setAttribute('aria-pressed', 'true');
            basculer(k);
          }
          b.addEventListener('click', function () {
            for (var j = 0; j < opts.length; j++) opts[j].setAttribute('aria-pressed', 'false');
            b.setAttribute('aria-pressed', 'true');
            basculer(k);
            garder(cible, b.textContent);
          });
        })(opts[i], i);
      }
    })(duels[d]);
  }

  /* ---------- le classement ----------
     Glissé à la souris, flèches au doigt. Le glissé seul exclurait une
     partie des gens et ne se rattraperait pas au clavier. */
  (function construireRang() {
    var liste = document.querySelector('[data-rang]');
    if (!liste) return;
    var cible = liste.getAttribute('data-cible');
    var items = [].slice.call(liste.children);

    var ordre = (rep[cible] || '').split(', ').filter(Boolean);
    if (ordre.length === items.length) {
      ordre.forEach(function (val) {
        var it = items.filter(function (x) { return x.getAttribute('data-val') === val; })[0];
        if (it) liste.appendChild(it);
      });
    }

    function habiller() {
      [].slice.call(liste.children).forEach(function (it, i, tous) {
        it.textContent = '';

        var num = document.createElement('span');
        num.className = 'rang__num';
        num.textContent = i + 1;

        var poignee = document.createElement('span');
        poignee.className = 'rang__poignee';
        poignee.setAttribute('aria-hidden', 'true');

        var txt = document.createElement('span');
        txt.textContent = it.getAttribute('data-val');

        var haut = document.createElement('button');
        haut.type = 'button'; haut.className = 'rang__fleche';
        haut.innerHTML = '&uarr;'; haut.disabled = (i === 0);
        haut.setAttribute('aria-label', 'monter ' + it.getAttribute('data-val'));
        haut.addEventListener('click', function () {
          liste.insertBefore(it, tous[i - 1]); habiller(); enregistrer();
        });

        var bas = document.createElement('button');
        bas.type = 'button'; bas.className = 'rang__fleche';
        bas.innerHTML = '&darr;'; bas.disabled = (i === tous.length - 1);
        bas.setAttribute('aria-label', 'descendre ' + it.getAttribute('data-val'));
        bas.addEventListener('click', function () {
          liste.insertBefore(tous[i + 1], it); habiller(); enregistrer();
        });

        it.appendChild(poignee); it.appendChild(num); it.appendChild(txt);
        it.appendChild(haut); it.appendChild(bas);
      });
    }

    function enregistrer() {
      garder(cible, [].slice.call(liste.children).map(function (it) {
        return it.getAttribute('data-val');
      }).join(', '));
    }

    var porte = null;
    liste.addEventListener('dragstart', function (e) {
      porte = e.target.closest('.rang__item');
      if (porte) porte.classList.add('est-pris');
    });
    liste.addEventListener('dragover', function (e) {
      e.preventDefault();
      var sur = e.target.closest('.rang__item');
      if (!sur || !porte || sur === porte) return;
      var apres = sur.getBoundingClientRect().top + sur.offsetHeight / 2 < e.clientY;
      liste.insertBefore(porte, apres ? sur.nextSibling : sur);
    });
    liste.addEventListener('dragend', function () {
      if (porte) porte.classList.remove('est-pris');
      porte = null; habiller(); enregistrer();
    });

    habiller(); enregistrer();
  })();

  /* ---------- les champs écrits, gardés à la frappe ---------- */
  var champs = form.querySelectorAll('textarea[data-champ], input[data-champ]');
  for (var c = 0; c < champs.length; c++) {
    (function (ch) {
      var cible = ch.getAttribute('data-champ');
      if (ch.type === 'hidden') return;
      if (rep[cible] !== undefined) ch.value = rep[cible];
      ch.addEventListener('input', function () { garder(cible, ch.value); });
    })(champs[c]);
  }

  /* ---------- le compteur de signes ----------
     Deux blocs du gabarit affichent leur phrase en très grand : au-delà de
     leur limite, elle remplit l’écran d’un téléphone et perd son effet. Le
     « maxlength » arrête la frappe, mais sans rien dire ; le compteur, lui,
     prévient avant qu’on se cogne. */
  (function poserCompteurs() {
    var comptes = form.querySelectorAll('[data-compte]');
    for (var i = 0; i < comptes.length; i++) {
      (function (ch) {
        var max   = parseInt(ch.getAttribute('maxlength'), 10) || 0;
        if (!max) return;
        var seuil = parseInt(ch.getAttribute('data-compte-seuil'), 10) || Math.max(1, max - 20);

        var vu = document.createElement('p');
        vu.className = 'ec__compte';
        vu.setAttribute('aria-hidden', 'true');
        ch.parentNode.insertBefore(vu, ch.nextSibling);

        function maj() {
          var n = ch.value.length;
          vu.textContent = n + ' / ' + max;
          vu.classList.toggle('est-proche', n >= seuil);
        }
        ch.addEventListener('input', maj);
        maj();
      })(comptes[i]);
    }
  })();

  /* ---------- le CV ---------- */
  (function construireDepot() {
    var depot = document.querySelector('[data-depot]');
    if (!depot) return;
    var entree = depot.querySelector('input[type="file"]');
    var titre = depot.querySelector('[data-depot-titre]');
    var note = depot.querySelector('[data-depot-note]');

    entree.addEventListener('change', function () {
      var f = entree.files && entree.files[0];
      if (!f) return;
      /* Huit mégaoctets : au-delà, l’envoi risque d’échouer et d’emporter
         tout le reste. Mieux vaut le dire ici que perdre les réponses. */
      if (f.size > 8 * 1024 * 1024) {
        entree.value = '';
        depot.classList.remove('est-rempli');
        titre.textContent = 'Choisir mon CV';
        note.textContent = 'Celui-là fait ' + Math.round(f.size / 1048576) +
                           ' Mo, c’est trop lourd. 8 Mo au plus.';
        return;
      }
      depot.classList.add('est-rempli');
      titre.textContent = f.name;
      note.textContent = 'Reçu. Touche ici pour en choisir un autre.';
    });
  })();

  /* ======================================================================
     4. La navigation
     ====================================================================== */
  var ecrans = [].slice.call(form.querySelectorAll('[data-ec]'));
  var final = document.querySelector('[data-ec-final]');
  var jauge = document.querySelector('[data-jauge]');
  var bloc  = form.closest('.fm') || form;
  var actif = 0;

  /* Le questionnaire n’occupe plus une page à lui seul : changer d’écran ne
     remonte donc pas en haut du document, mais en haut de la section. */
  function remonter() {
    var y = bloc.getBoundingClientRect().top +
            (window.pageYOffset || document.documentElement.scrollTop || 0);
    try { window.scrollTo({ top: y, behavior: 'instant' }); }
    catch (e) { window.scrollTo(0, y); }
  }

  /* ---------- les annonces de section ----------
     Un écran très court ouvre chaque section : son nom, rien d’autre. Il
     donne les paliers du parcours, on ne franchit plus une trentaine de
     questions, on en franchit six. Il est posé ici plutôt qu’écrit dans le
     HTML pour que le nom d’une section n’existe qu’à un seul endroit. */
  /* Une section peut annoncer sa règle sous son nom. « Deux histoires » est
     la seule à en avoir besoin : c’est le seul endroit du formulaire où l’on
     demande un vrai souvenir, et dire tout de suite qu’il tient en deux
     lignes évite le pavé qu’on essaie justement de ne plus recevoir. */
  var SOUS_TITRES = {
    'Deux histoires': 'Deux souvenirs. Deux lignes chacun.'
  };

  (function poserAnnonces() {
    var courante = null;
    var premiere = true;
    ecrans.forEach(function (ec) {
      var sec = ec.getAttribute('data-section');
      if (!sec || sec === courante) return;
      courante = sec;
      /* Pas d’annonce sur la première section : on y arrive en descendant la
         page, on ne franchit rien. Elle s’effacerait toute seule avant même
         qu’on ait fini de scroller. */
      if (premiere) { premiere = false; return; }

      var annonce = document.createElement('section');
      annonce.className = 'ec ec--annonce';
      annonce.setAttribute('data-ec', '');
      annonce.setAttribute('data-hors-compte', '');
      annonce.setAttribute('data-annonce', sec);
      annonce.setAttribute('data-section', sec);

      var nom = document.createElement('p');
      nom.className = 'ec__annonce';
      nom.textContent = sec;
      annonce.appendChild(nom);

      if (SOUS_TITRES[sec]) {
        var sous = document.createElement('p');
        sous.className = 'ec__annonce-sous';
        sous.textContent = SOUS_TITRES[sec];
        annonce.appendChild(sous);
      }

      ec.parentNode.insertBefore(annonce, ec);
    });
    ecrans = [].slice.call(form.querySelectorAll('[data-ec]'));
  })();

  /* La position se compte à l’intérieur de la section, jamais sur le total :
     « 2 sur 4 » se franchit, « 2 / 29 » annonce un marathon. Les écrans
     branchés entrent et sortent du compte selon les réponses, d’où le
     recalcul complet à chaque passage. */
  function majEcrans() {
    var vus = ecrans;

    var total = {};
    vus.forEach(function (ec) {
      var sec = ec.getAttribute('data-section');
      if (!sec || ec.hasAttribute('data-hors-compte')) return;
      total[sec] = (total[sec] || 0) + 1;
    });

    var rang = {};
    vus.forEach(function (ec) {
      var compteur = ec.querySelector('[data-compteur]');
      if (!compteur) return;
      var sec = ec.getAttribute('data-section');
      if (!sec || ec.hasAttribute('data-hors-compte')) { compteur.textContent = ''; return; }
      rang[sec] = (rang[sec] || 0) + 1;
      compteur.textContent = sec + ' · ' + rang[sec] + ' sur ' + total[sec];
    });

    if (jauge) {
      var place = vus.indexOf(ecrans[actif]);
      if (place > -1 && vus.length > 1) {
        jauge.style.width = Math.round((place / (vus.length - 1)) * 100) + '%';
      }
    }
  }

  /* L’annonce de section n’a pas de bouton : elle s’efface d’elle-même.
     Une touche n’importe où la passe tout de suite, pour qui va plus vite. */
  var minuterie = null;
  function couperMinuterie() {
    if (minuterie) { clearTimeout(minuterie); minuterie = null; }
  }

  /* L’historique du navigateur suit le parcours : « précédent » ramène à la
     question d’avant plutôt que de quitter la page. Les annonces de section
     n’y entrent pas, elles s’effacent d’elles-mêmes, y revenir ferait
     rebondir en avant aussitôt. */
  var historique = !!(window.history && window.history.pushState);
  if (historique) {
    try { history.replaceState({ mlEc: 0 }, ''); }
    catch (e) { historique = false; }
  }

  function montrer(i, depuisLHistorique) {
    couperMinuterie();
    ecrans[actif].classList.remove('est-actif');
    actif = i;
    ecrans[actif].classList.add('est-actif');
    majEcrans();
    remonter();

    var annonce = ecrans[actif].hasAttribute('data-annonce');
    if (historique && !depuisLHistorique && !annonce) {
      try { history.pushState({ mlEc: i }, ''); } catch (e) { /* rien de grave */ }
    }
    majRetour();

    if (annonce) {
      /* Une annonce qui porte une règle sous son nom demande le temps de la
         lire : sinon elle passe avant qu’on l’ait vue. */
      var duree = ecrans[actif].querySelector('.ec__annonce-sous') ? 1900 : 1150;
      minuterie = setTimeout(function () { minuterie = null; suivant(); }, duree);
      return;
    }

    /* Le premier champ écrit prend le curseur, mais jamais au doigt : le
       clavier qui surgit masquerait la question qu’on vient d’afficher. */
    if (window.matchMedia('(min-width: 720px)').matches) {
      var premier = ecrans[actif].querySelector('textarea, input[type="text"], input[type="email"], input[type="tel"]');
      if (premier) premier.focus();
    }
  }

  function suivant() {
    /* Valider un écran, c’est être entré dans le parcours : à partir d’ici,
       l’accueil ne doit plus rien effacer, même après un onglet fermé. */
    marquerLeParcours();
    if (actif + 1 < ecrans.length) montrer(actif + 1);
  }

  /* On ne revient jamais sur une annonce : elle repartirait en avant. Avant la
     première question, il n’y a rien où revenir. */
  function precedent() {
    for (var i = actif - 1; i >= 0; i--) {
      if (!ecrans[i].hasAttribute('data-annonce')) return i;
    }
    return -1;
  }

  function retourner() {
    if (historique && history.state && history.state.mlEc === actif) {
      history.back();
      return;
    }
    var j = precedent();
    if (j > -1) montrer(j);
  }

  window.addEventListener('popstate', function (e) {
    var i = e.state && typeof e.state.mlEc === 'number' ? e.state.mlEc : -1;
    if (i < 0 || i >= ecrans.length || i === actif) return;
    montrer(i, true);
  });

  /* Le retour est posé ici plutôt que répété trente fois dans le HTML : il est
     le même partout, et il ne peut pas manquer sur un écran. */
  (function poserRetours() {
    ecrans.forEach(function (ec) {
      var nav = ec.querySelector('.ec__nav, .mot__nav');
      if (!nav) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ec__retour';
      b.setAttribute('data-retour', '');
      b.innerHTML = '&larr; retour';
      nav.appendChild(b);
    });
  })();

  /* Une fois dans les questions, rien ne ramenait au site : le visiteur était
     dans un tunnel. Ce lien remonte en haut de la même page, il ne recharge
     rien et ne quitte rien : aucune réponse ne peut être perdue, et redescendre
     ramène sur la question qu’on venait de quitter. Les annonces de section
     n’en portent pas, elles s’effacent avant qu’on ait pu viser. */
  (function poserLiensSite() {
    ecrans.forEach(function (ec) {
      if (ec.hasAttribute('data-annonce')) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ec__site';
      b.setAttribute('data-site', '');
      b.textContent = 'le site';
      ec.insertBefore(b, ec.firstChild);
    });
  })();

  function versLeSite() {
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (e) { window.scrollTo(0, 0); }
  }

  function majRetour() {
    var rien = precedent() < 0;
    var tous = form.querySelectorAll('[data-retour]');
    for (var i = 0; i < tous.length; i++) tous[i].hidden = rien;
  }

  /* Les quatre champs obligatoires sont les seuls à barrer le passage.
     Partout ailleurs, « je passe » est un chemin normal. */
  function valide(ec) {
    var quoi = ec.getAttribute('data-obligatoire');
    if (!quoi) return true;
    var erreur = ec.querySelector('[data-erreur]');

    if (quoi === 'cv') {
      var entree = ec.querySelector('input[type="file"]');
      if (entree && entree.files && entree.files.length) { if (erreur) erreur.textContent = ''; return true; }
      if (erreur) erreur.textContent = 'Il me le faut : c’est lui qui porte les dates et les noms.';
      return false;
    }
    if (quoi === 'mail') {
      var mail = ec.querySelector('input[type="email"]');
      var v = mail ? mail.value.trim() : '';
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { if (erreur) erreur.textContent = ''; return true; }
      if (erreur) erreur.textContent = 'Sans mail, je ne peux pas te livrer ta page.';
      return false;
    }
    return true;
  }

  form.addEventListener('click', function (e) {
    if (e.target.closest('[data-annonce]')) { e.preventDefault(); suivant(); return; }

    var b = e.target.closest('[data-site], [data-retour], [data-suivant], [data-passe], [data-envoyer]');
    if (!b) return;
    e.preventDefault();

    if (b.hasAttribute('data-site'))   { versLeSite(); return; }
    if (b.hasAttribute('data-retour')) { retourner(); return; }
    if (b.hasAttribute('data-envoyer')) { envoyer(); return; }
    if (b.hasAttribute('data-suivant') && !valide(ecrans[actif])) return;
    suivant();
  });

  /* Entrée passe à la suite dans un champ d’une ligne, jamais dans un champ
     de fond : là, elle sert à aller à la ligne. */
  form.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var t = e.target;
    if (t.tagName === 'TEXTAREA') return;
    if (t.tagName === 'INPUT' && t.type !== 'file') {
      e.preventDefault();
      if (valide(ecrans[actif])) suivant();
    }
  });

  majEcrans();
  majRetour();

  /* ======================================================================
     5. L’envoi
     ====================================================================== */
  var motEnvoi = document.querySelector('[data-envoi]');

  /* La référence rattache les photos aux réponses. Prénom en clair pour
     qu’elle se lise, quatre caractères tirés au sort pour qu’elle soit
     unique. Ni O ni 0, ni I ni 1 : on la recopie parfois à la main. */
  var ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function fabriquerReference() {
    /* La base est refaite à chaque envoi, à partir du prénom qui vient
       d’être saisi : une référence gardée d’une visite précédente portait
       le prénom de quelqu’un d’autre. Seuls les quatre caractères sont
       repris s’ils existent déjà, ils n’appartiennent à personne. */
    var base = (rep.prenom || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'page';

    var suite = '';
    var ancienne = /-([A-Z0-9]{4})$/.exec(rep.reference || '');
    if (ancienne) suite = ancienne[1];
    else for (var i = 0; i < 4; i++) suite += ALPHA.charAt(Math.floor(Math.random() * ALPHA.length));

    rep.reference = base + '-' + suite;
    ecrire();
    return rep.reference;
  }

  function envoyer() {
    /* On revalide les deux écrans obligatoires : on a pu y arriver par un
       « je passe » d’un écran voisin. */
    for (var i = 0; i < ecrans.length; i++) {
      if (ecrans[i].hasAttribute('data-obligatoire') && !valide(ecrans[i])) {
        montrer(i);
        return;
      }
    }

    /* Le prénom, l’âge et la couleur sont relus maintenant : ils viennent des
       trois questions posées plus haut dans la même page. */
    reprendreLeDebut();

    var reference = fabriquerReference();

    /* Les champs cachés reçoivent ce que les gestes ont produit. */
    var caches = form.querySelectorAll('input[type="hidden"][data-champ]');
    for (var h = 0; h < caches.length; h++) {
      var nom = caches[h].getAttribute('data-champ');
      /* Une valeur déclarée dans le HTML est une réponse par défaut, pas du
         vide : « l’afficher sur ma page » vaut « non » tant qu’on n’y a pas
         touché. On ne l’écrase que si la personne a répondu. */
      caches[h].value = (nom === 'reference') ? reference
        : (rep[nom] !== undefined ? rep[nom] : caches[h].value);
    }
    ecrire();

    if (motEnvoi) {
      motEnvoi.hidden = false;
      motEnvoi.className = 'envoi';
      motEnvoi.textContent = 'J’envoie…';
    }

    /* Le seul fichier de cet envoi est le CV : il part tel quel, sous le
       « name » que porte son champ. Les photos, elles, ont leur page à
       elles, et leur propre compression. */
    var corps = new FormData(form);

    fetch(location.pathname, { method: 'POST', body: corps })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        rep.envoye = true;
        ecrire();
        /* Le parcours est fini : la prochaine arrivée sur l’accueil repart
           d’une page vierge. Les photos, elles, se rattachent par la
           référence, qui voyage dans le lien et dans le mail. */
        oublierLeParcours();
        reussi(reference);
      })
      .catch(function () {
        if (!motEnvoi) return;
        motEnvoi.className = 'envoi envoi--rate';
        motEnvoi.textContent = 'L’envoi n’est pas passé. Tes réponses sont toujours ' +
          'là, sur ton téléphone, réessaie, rien n’est perdu.';
      });
  }

  function reussi(reference) {
    form.hidden = true;
    if (jauge) jauge.style.width = '100%';
    if (!final) return;
    final.hidden = false;
    final.classList.add('est-actif');

    var code = final.querySelector('[data-ref-code]');
    if (code) code.textContent = reference;

    var lien = final.querySelector('[data-lien-fichiers]');
    if (lien) lien.href = 'formulaire/fichiers/?ref=' + encodeURIComponent(reference);

    remonter();
  }

  /* Dernier filet : ce qui est en attente d’écriture part sur le disque
     avant que la page ne se ferme. */
  window.addEventListener('pagehide', ecrire);
})();
