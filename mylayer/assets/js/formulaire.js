/* ==========================================================================
   MyLayer — le formulaire, partie 1
   --------------------------------------------------------------------------
   1. Ce que la page d’accueil a déjà donné (prénom, âge, couleur)
   2. Les questions construites en JS : les mots, les langues, les pays
   3. Les gestes : choix, duels, classement
   4. La navigation d’un écran à l’autre
   5. La sauvegarde locale, en continu
   6. L’envoi, et la référence qui rattachera les photos

   Principe qui traverse tout le fichier : une réponse écrite ne doit jamais
   pouvoir être perdue. Elle est gardée sur le téléphone à chaque frappe, et
   elle y reste même après un envoi réussi.
   ========================================================================== */

(function () {
  'use strict';

  var CLE_DEBUT = 'mylayer.debut';       /* écrite par la page d’accueil */
  var CLE       = 'mylayer.formulaire';

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
     1 — Ce que la page d’accueil a déjà donné
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
    '#1A1A1A': 'Encre'
  };

  var debut = lire(CLE_DEBUT);

  function reprendreLAccueil() {
    if (debut.prenom) rep.prenom = debut.prenom;
    if (debut.age)    rep.age    = String(debut.age);

    if (debut.couleur) {
      var t = String(debut.couleur).split(',');
      var racine = document.documentElement;
      racine.style.setProperty('--c', t[0]);
      racine.style.setProperty('--c-deep', t[1]);
      racine.style.setProperty('--c-bright', t[2]);
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', t[0]);

      var nom = COULEURS[t[0].toUpperCase()] || 'sur mesure';
      rep.couleur = nom + ' (' + t[0] + ')';
    }

    var salut = document.querySelector('[data-salut]');
    if (salut && rep.prenom) {
      salut.textContent = 'On reprend où t’en étais, ' + rep.prenom +
                          '. Ton prénom, ton âge et ta couleur sont déjà gardés.';
      salut.hidden = false;
    }
    ecrire();
  }
  reprendreLAccueil();

  /* ======================================================================
     2 — Les questions construites en JS
     ====================================================================== */

  /* ---------- les 25 mots ----------
     Cinq familles, aucun mot faible, aucun jugement de valeur. La liste est
     écrite une seule fois : les questions 4 et 5 posent exactement la même,
     et c’est l’écart entre les deux réponses qui est la matière. */
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
      if (i > -1) {
        choisis.splice(i, 1);
      } else {
        /* Trois, pas quatre : au-delà, le portrait se dilue. Le plus ancien
           cède sa place plutôt que de bloquer le geste par un refus. */
        if (choisis.length >= 3) {
          var perdu = choisis.shift();
          var tous = hote.querySelectorAll('.choix__opt');
          for (var k = 0; k < tous.length; k++) {
            if (tous[k].textContent === perdu) tous[k].setAttribute('aria-pressed', 'false');
          }
        }
        choisis.push(mot);
      }
      bouton.setAttribute('aria-pressed', choisis.indexOf(mot) > -1 ? 'true' : 'false');
      garder(cible, choisis.join(', '));
      majJauge();
    }

    function majJauge() {
      if (!jauge) return;
      jauge.textContent = choisis.length + ' sur 3';
      jauge.classList.toggle('est-plein', choisis.length === 3);
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

  /* ======================================================================
     3 — Les gestes
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

  /* « oui » ouvre un bloc dans le même écran (les pays), ou débloque des
     écrans plus loin (le projet). « non » referme. */
  function reagir(groupe, valeur) {
    var ouvre = groupe.getAttribute('data-ouvre');
    if (ouvre) {
      var bloc = document.querySelector('[data-bloc="' + ouvre + '"]');
      if (bloc) bloc.hidden = (valeur !== 'oui');
    }
    if (groupe.getAttribute('data-branche')) majEcrans();
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
      for (var i = 0; i < opts.length; i++) {
        (function (b) {
          if (rep[cible] === b.textContent) b.setAttribute('aria-pressed', 'true');
          b.addEventListener('click', function () {
            for (var j = 0; j < opts.length; j++) opts[j].setAttribute('aria-pressed', 'false');
            b.setAttribute('aria-pressed', 'true');
            garder(cible, b.textContent);
          });
        })(opts[i]);
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

        it.appendChild(num); it.appendChild(txt);
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

  /* ======================================================================
     4 — La navigation
     ====================================================================== */
  var ecrans = [].slice.call(form.querySelectorAll('[data-ec]'));
  var final = document.querySelector('[data-ec-final]');
  var jauge = document.querySelector('[data-jauge]');
  var actif = 0;

  /* Un écran de branche n’existe que si la branche est ouverte. */
  function visible(ec) {
    var branche = ec.getAttribute('data-branche-de');
    if (!branche) return true;
    return rep.a_projet === 'oui';
  }

  function majEcrans() {
    var vus = ecrans.filter(visible);
    var numero = 0;
    vus.forEach(function (ec) {
      var compteur = ec.querySelector('[data-compteur]');
      if (ec.hasAttribute('data-hors-compte')) return;
      numero++;
      if (compteur) compteur.textContent = numero + ' / ' +
        vus.filter(function (x) { return !x.hasAttribute('data-hors-compte'); }).length;
    });
    if (jauge) {
      var place = vus.indexOf(ecrans[actif]);
      if (place > -1 && vus.length > 1) {
        jauge.style.width = Math.round((place / (vus.length - 1)) * 100) + '%';
      }
    }
  }

  function montrer(i) {
    ecrans[actif].classList.remove('est-actif');
    actif = i;
    ecrans[actif].classList.add('est-actif');
    majEcrans();
    window.scrollTo(0, 0);

    /* Le premier champ écrit prend le curseur — mais jamais au doigt : le
       clavier qui surgit masquerait la question qu’on vient d’afficher. */
    if (window.matchMedia('(min-width: 720px)').matches) {
      var premier = ecrans[actif].querySelector('textarea, input[type="text"], input[type="email"], input[type="tel"]');
      if (premier) premier.focus();
    }
  }

  function suivant() {
    for (var i = actif + 1; i < ecrans.length; i++) {
      if (visible(ecrans[i])) { montrer(i); return; }
    }
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
      if (erreur) erreur.textContent = 'Sans mail, je ne peux pas te livrer ta fiche.';
      return false;
    }
    return true;
  }

  form.addEventListener('click', function (e) {
    var b = e.target.closest('[data-suivant], [data-passe], [data-envoyer]');
    if (!b) return;
    e.preventDefault();

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

  /* ======================================================================
     5 — L’envoi
     ====================================================================== */
  var motEnvoi = document.querySelector('[data-envoi]');

  /* La référence rattache les photos aux réponses. Prénom en clair pour
     qu’elle se lise, quatre caractères tirés au sort pour qu’elle soit
     unique. Ni O ni 0, ni I ni 1 : on la recopie parfois à la main. */
  function fabriquerReference() {
    if (rep.reference) return rep.reference;
    var base = (rep.prenom || 'fiche')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'fiche';
    var alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var suite = '';
    for (var i = 0; i < 4; i++) suite += alpha.charAt(Math.floor(Math.random() * alpha.length));
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

    var reference = fabriquerReference();

    /* Les champs cachés reçoivent ce que les gestes ont produit. */
    var caches = form.querySelectorAll('input[type="hidden"][data-champ]');
    for (var h = 0; h < caches.length; h++) {
      var nom = caches[h].getAttribute('data-champ');
      /* Une valeur déclarée dans le HTML est une réponse par défaut, pas du
         vide : « l’afficher sur ma fiche » vaut « non » tant qu’on n’y a pas
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

    fetch(location.pathname, { method: 'POST', body: new FormData(form) })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        rep.envoye = true;
        ecrire();
        reussi(reference);
      })
      .catch(function () {
        if (!motEnvoi) return;
        motEnvoi.className = 'envoi envoi--rate';
        motEnvoi.textContent = 'L’envoi n’est pas passé. Tes réponses sont toujours ' +
          'là, sur ton téléphone — réessaie, rien n’est perdu.';
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
    if (lien) lien.href = 'fichiers/?ref=' + encodeURIComponent(reference);

    window.scrollTo(0, 0);
  }

  /* Dernier filet : ce qui est en attente d’écriture part sur le disque
     avant que la page ne se ferme. */
  window.addEventListener('pagehide', ecrire);
})();
