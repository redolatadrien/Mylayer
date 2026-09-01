/* ==========================================================================
   MyLayer, le questionnaire
   --------------------------------------------------------------------------
   1. Ce que les premières questions ont donné (prénom, âge, couleur, police)
   2. Les questions construites en JS : les mots, les langues, les pays
   3. Les gestes : choix, duels, classement, champs multiples, fichiers joints
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

  /* ---------- les 25 mots ----------
     Cinq familles, aucun mot faible, aucun jugement de valeur. Trois mots au
     minimum, et pas de plafond : au-delà de trois, c’est encore du portrait. */
  var MOTS = [
    ['Rapport aux autres',  ['Sociable', 'Discret', 'Attentif', 'Direct', 'Diplomate']],
    ['Rapport à l’action',  ['Rapide', 'Méthodique', 'Débrouillard', 'Persévérant', 'Spontané']],
    ['Rapport aux idées',   ['Curieux', 'Créatif', 'Pragmatique', 'Rêveur', 'Observateur']],
    ['Tempérament',         ['Calme', 'Énergique', 'Drôle', 'Sérieux', 'Indépendant']],
    ['Engagement',          ['Fiable', 'Généreux', 'Exigeant', 'Adaptable', 'Passionné']]
  ];

  function construireMots(hote) {
    var cible = hote.getAttribute('data-mots');
    var choisis = (rep[cible] || '').split(', ').filter(Boolean);
    var jauge = document.querySelector('[data-jauge-mots="' + cible + '"]');

    MOTS.forEach(function (fam) {
      var bloc = document.createElement('div');
      bloc.className = 'famille';
      var titre = document.createElement('p');
      titre.className = 'famille__nom';
      titre.textContent = fam[0];
      bloc.appendChild(titre);

      var rangee = document.createElement('div');
      rangee.className = 'choix';
      fam[1].forEach(function (mot) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'choix__opt';
        b.textContent = mot;
        b.setAttribute('aria-pressed', choisis.indexOf(mot) > -1 ? 'true' : 'false');
        b.addEventListener('click', function () { basculerMot(b, mot); });
        rangee.appendChild(b);
      });
      bloc.appendChild(rangee);
      hote.appendChild(bloc);
    });

    function basculerMot(bouton, mot) {
      var i = choisis.indexOf(mot);
      if (i > -1) choisis.splice(i, 1); else choisis.push(mot);
      bouton.setAttribute('aria-pressed', choisis.indexOf(mot) > -1 ? 'true' : 'false');
      garder(cible, choisis.join(', '));
      majJauge();
    }

    /* En dessous de trois, « Continuer » ne s’ouvre pas. « je passe » reste
       ouvert : sauter une question est un chemin normal, ici comme ailleurs. */
    var ecran = hote.closest('[data-ec]');
    var bouton = ecran ? ecran.querySelector('[data-suivant]') : null;

    function majJauge() {
      var assez = choisis.length >= 3;
      if (jauge) jauge.classList.toggle('est-plein', assez);
      if (bouton) bouton.disabled = !assez;
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
  (function construirePays() {
    var liste = document.querySelector('[data-pays-liste]');
    var hoteChoisis = document.querySelector('[data-pays-choisis]');
    var cherche = document.getElementById('c-pays-cherche');
    if (!liste || !window.MYLAYER_PAYS) return;

    /* « Thaïlande (TH), Canada (CA) » → ['TH', 'CA'] */
    var choisis = (rep.pays || '').split(', ').filter(Boolean).map(function (b) {
      var o = b.lastIndexOf(' (');
      return o > -1 ? b.slice(o + 2, -1) : '';
    }).filter(Boolean);

    function sansAccent(s) {
      return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function dessiner() {
      var q = sansAccent((cherche && cherche.value || '').trim());
      liste.textContent = '';

      var vus = window.MYLAYER_PAYS.filter(function (p) {
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
        b.setAttribute('aria-pressed', choisis.indexOf(p.code) > -1 ? 'true' : 'false');
        b.addEventListener('click', function () {
          var i = choisis.indexOf(p.code);
          if (i > -1) choisis.splice(i, 1); else choisis.push(p.code);
          b.setAttribute('aria-pressed', i > -1 ? 'false' : 'true');
          majPays();
        });
        liste.appendChild(b);
      });
    }

    function majPays() {
      /* On garde les noms ET les codes : le nom pour se relire, le code
         pour qu’une carte puisse être allumée plus tard sans re-deviner. */
      var sortie = choisis.map(function (code) {
        var p = window.MYLAYER_PAYS.filter(function (x) { return x.code === code; })[0];
        return p ? p.nom + ' (' + p.code + ')' : code;
      });
      garder('pays', sortie.join(', '));

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
            majPays(); dessiner();
          });
          hoteChoisis.appendChild(b);
        });
      }
    }

    if (cherche) cherche.addEventListener('input', dessiner);
    dessiner(); majPays();
  })();

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

  /* ======================================================================
     3. Les gestes
     ====================================================================== */

  /* ---------- un seul choix ---------- */
  var uniques = document.querySelectorAll('[data-unique]');
  for (var u = 0; u < uniques.length; u++) {
    (function (groupe) {
      var cible = groupe.getAttribute('data-cible');
      var opts = groupe.querySelectorAll('.choix__opt');

      for (var i = 0; i < opts.length; i++) {
        (function (b) {
          if (rep[cible] === b.textContent) b.setAttribute('aria-checked', 'true');
          b.addEventListener('click', function () {
            for (var j = 0; j < opts.length; j++) opts[j].setAttribute('aria-checked', 'false');
            b.setAttribute('aria-checked', 'true');
            garder(cible, b.textContent);
            reagir(groupe, b.textContent);
          });
        })(opts[i]);
      }
      if (rep[cible]) reagir(groupe, rep[cible]);
    })(uniques[u]);
  }

  /* « oui » ouvre un bloc dans le même écran : c’est le cas des pays, sous la
     question du voyage. « non » le referme. */
  function reagir(groupe, valeur) {
    var ouvre = groupe.getAttribute('data-ouvre');
    if (!ouvre) return;
    var bloc = document.querySelector('[data-bloc="' + ouvre + '"]');
    if (bloc) bloc.hidden = (valeur !== 'oui');
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


  /* ---------- les fichiers joints à une question ----------
     Deux questions peuvent montrer autre chose qu’un texte : les réalisations,
     et les endroits qui comptent. Ces fichiers partent avec les réponses, dans
     le même envoi que le CV.

     La compression n’est pas un confort : une photo de téléphone pèse 2 à 4 Mo,
     trois suffiraient à épuiser le quota mensuel. Allégées à 300-400 Ko, elles
     rendent le circuit tenable. C’est le traitement de la page de dépôt, écrit
     ici pour que cette page ne dépende d’aucune autre. */
  var JOINT_CIBLE = 380 * 1024;      /* le poids visé par photo, une fois allégée */
  var JOINT_COTE  = 1600;            /* le plus grand côté, en pixels */
  var JOINT_MAX   = 8 * 1024 * 1024; /* le plafond par fichier, avant allègement */

  var joints = {};                   /* nom d’emplacement → { blob, nom } */

  /* Le navigateur applique tout seul l’orientation EXIF à une <img> : passer
     par elle plutôt que par createImageBitmap évite les portraits couchés. */
  function chargerImage(fichier) {
    return new Promise(function (resoudre, rejeter) {
      var url = URL.createObjectURL(fichier);
      var img = new Image();
      img.onload  = function () { URL.revokeObjectURL(url); resoudre(img); };
      img.onerror = function () { URL.revokeObjectURL(url); rejeter(new Error('illisible')); };
      img.src = url;
    });
  }

  function versJpeg(img, largeur, hauteur, q) {
    return new Promise(function (resoudre) {
      var toile = document.createElement('canvas');
      toile.width = largeur; toile.height = hauteur;
      var ctx = toile.getContext('2d');
      /* Un fond blanc : un PNG transparent aplati en JPEG sortirait noir. */
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, largeur, hauteur);
      ctx.drawImage(img, 0, 0, largeur, hauteur);
      toile.toBlob(resoudre, 'image/jpeg', q);
    });
  }

  function estImage(fichier) {
    return /^image\//.test(fichier.type) ||
           /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(fichier.name);
  }

  /* On descend la qualité par paliers, puis la taille si ça ne suffit pas. */
  function alleger(fichier) {
    if (!estImage(fichier)) {
      return Promise.resolve({ blob: fichier, nom: fichier.name });
    }

    return chargerImage(fichier).then(function (img) {
      var ratio = Math.min(1, JOINT_COTE / Math.max(img.naturalWidth, img.naturalHeight));
      var l = Math.round(img.naturalWidth * ratio);
      var h = Math.round(img.naturalHeight * ratio);

      var qualites = [0.82, 0.72, 0.62, 0.52, 0.44];
      var i = 0;

      function essai(largeur, hauteur) {
        return versJpeg(img, largeur, hauteur, qualites[i]).then(function (blob) {
          if (!blob) throw new Error('illisible');
          if (blob.size <= JOINT_CIBLE) return blob;
          i++;
          if (i < qualites.length) return essai(largeur, hauteur);
          /* Toutes les qualités épuisées : on réduit encore la taille, une
             seule fois. Au-delà, la photo ne vaudrait plus rien. */
          if (largeur > 1200) {
            i = 1;
            return essai(Math.round(largeur * 0.75), Math.round(hauteur * 0.75));
          }
          return blob;
        });
      }

      return essai(l, h).then(function (blob) {
        return { blob: blob, nom: fichier.name.replace(/\.[^.]+$/, '') + '.jpg' };
      });
    }).catch(function () {
      /* Le cas connu : les iPhone photographient en HEIC, que les navigateurs
         de bureau ne savent pas ouvrir. Sur l’iPhone lui-même, Safari le
         décode et on ne passe jamais ici. */
      var heic = /\.(heic|heif)$/i.test(fichier.name);
      throw new Error(heic
        ? 'Cette photo est en HEIC, un format que ce navigateur ne sait pas ouvrir. Envoie-la depuis ton téléphone.'
        : 'Je n’arrive pas à ouvrir ce fichier. Essaie une autre photo.');
    });
  }

  function joliPoids(octets) {
    return octets < 1024 * 1024
      ? Math.round(octets / 1024) + ' Ko'
      : (octets / 1048576).toFixed(1).replace('.', ',') + ' Mo';
  }

  function dessinerVignette(vignette, res, slot) {
    vignette.textContent = '';

    if (/^image\//.test(res.blob.type)) {
      var img = document.createElement('img');
      img.src = URL.createObjectURL(res.blob);
      img.alt = '';
      img.addEventListener('load', function () { URL.revokeObjectURL(img.src); });
      vignette.appendChild(img);
    } else {
      var doc = document.createElement('span');
      doc.className = 'vignette__doc';
      doc.textContent = res.nom;
      vignette.appendChild(doc);
    }

    var poids = document.createElement('span');
    poids.className = 'vignette__poids';
    poids.textContent = joliPoids(res.blob.size);
    vignette.appendChild(poids);

    var retirer = document.createElement('button');
    retirer.type = 'button';
    retirer.className = 'vignette__retirer';
    retirer.innerHTML = '&times;';
    retirer.setAttribute('aria-label', 'retirer ' + res.nom);
    retirer.addEventListener('click', function (e) {
      e.preventDefault();
      delete joints[slot];
      vignette.parentNode.removeChild(vignette);
    });
    vignette.appendChild(retirer);
  }

  function brancherJoint(zone) {
    var slots  = zone.getAttribute('data-slots').split(',');
    var max    = parseInt(zone.getAttribute('data-max'), 10) || 1;
    var entree = zone.querySelector('[data-choix]');
    var hote   = zone.parentNode.querySelector('[data-vignettes]');
    var note   = zone.querySelector('[data-depot-note]');
    var texteOrigine = note ? note.textContent : '';

    function libres() {
      return slots.filter(function (s) { return !joints[s]; });
    }

    entree.addEventListener('change', function () {
      var fichiers = [].slice.call(entree.files || []);
      entree.value = '';                    /* pour pouvoir reprendre le même */
      if (!fichiers.length) return;

      var place = libres();
      if (!place.length) {
        if (note) note.textContent = 'C’est complet (' + max + ' au maximum). Retires-en un d’abord.';
        return;
      }
      if (note) note.textContent = texteOrigine;

      /* Le plafond se dit avec le poids du fichier refusé : « c’est trop
         lourd » sans chiffre n’apprend rien à personne. */
      var refuses = [];
      var retenus = fichiers.slice(0, place.length).filter(function (f) {
        if (f.size <= JOINT_MAX) return true;
        refuses.push(f.name + ' fait ' + joliPoids(f.size));
        return false;
      });

      if (refuses.length && note) {
        note.textContent = refuses.join(', ') + ' : c’est trop lourd. 8 Mo au plus par fichier.';
      } else if (fichiers.length > place.length && note) {
        note.textContent = 'J’en ai pris ' + place.length + ' : c’est le maximum ici.';
      }

      retenus.forEach(function (fichier, k) {
        var slot = place[k];
        joints[slot] = { blob: null, nom: fichier.name };   /* on réserve la place */

        var vignette = document.createElement('div');
        vignette.className = 'vignette est-en-cours';
        hote.appendChild(vignette);

        alleger(fichier).then(function (res) {
          joints[slot] = res;
          vignette.classList.remove('est-en-cours');
          dessinerVignette(vignette, res, slot);
        }).catch(function (err) {
          delete joints[slot];
          vignette.parentNode.removeChild(vignette);
          if (note) note.textContent = err.message;
        });
      });
    });
  }

  var zonesJointes = form.querySelectorAll('[data-joint] [data-zone]');
  for (var zj = 0; zj < zonesJointes.length; zj++) brancherJoint(zonesJointes[zj]);

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
      minuterie = setTimeout(function () { minuterie = null; suivant(); }, 1150);
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

    /* Un fichier encore en cours d’allègement partirait vide. */
    var enCours = Object.keys(joints).filter(function (s) { return !joints[s].blob; }).length;
    if (enCours > 0) {
      if (motEnvoi) {
        motEnvoi.hidden = false;
        motEnvoi.className = 'envoi';
        motEnvoi.textContent = 'J’allège encore ' + enCours +
          (enCours > 1 ? ' fichiers' : ' fichier') + ', deux secondes.';
      }
      return;
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

    /* Les emplacements déclarés dans le HTML servent à la détection par
       Netlify au déploiement ; le corps envoyé, lui, reçoit ici les versions
       allégées à la place des fichiers d’origine. */
    var corps = new FormData(form);
    var places = form.querySelectorAll('[data-emplacements] input[name]');
    for (var e = 0; e < places.length; e++) corps.delete(places[e].getAttribute('name'));
    Object.keys(joints).forEach(function (slot) {
      if (joints[slot] && joints[slot].blob) {
        corps.append(slot, joints[slot].blob, joints[slot].nom);
      }
    });

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
