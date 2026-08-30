/* ==========================================================================
   MyLayer, comportements de la page d’accueil
   --------------------------------------------------------------------------
   1. Apparitions au scroll
   2. La page qui défile dans le grand téléphone
   3. Les premières questions : prénom, âge, couleur, police, et la page se repeint
   Rien n’est jamais masqué durablement : si quoi que ce soit échoue,
   toutAfficher() remet la page entière en état lisible.
   ========================================================================== */

(function () {
  'use strict';

  var reveals = document.querySelectorAll('.reveal');

  function toutAfficher() {
    for (var i = 0; i < reveals.length; i++) reveals[i].classList.add('is-in');
  }

  var reduit = false;
  try {
    reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* vieux navigateur */ }

  /* ======================================================================
     2. La page d’Adrien, dans le grand téléphone
     Le défilement lui-même est purement CSS (overflow-y: auto) : c’est le
     visiteur qui l’actionne, et le navigateur rend la main à la page une
     fois la page au bout. On ne s’occupe ici que du dégradé du bas, qui
     s’efface quand il n’y a plus rien à lire, sans JS, il reste affiché,
     ce qui n’enlève rien.
     ====================================================================== */
  function brancherPage() {
    var page = document.querySelector('[data-page]');
    if (!page) return;

    var tick = false;

    function jauger() {
      tick = false;
      var reste = page.scrollHeight - page.scrollTop - page.clientHeight;
      page.classList.toggle('est-au-bout', reste < 12);
    }

    page.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(jauger);
    }, { passive: true });

    window.addEventListener('resize', jauger);
    // Les photos arrivent en différé : chacune rallonge la page.
    window.addEventListener('load', jauger);
    jauger();
  }

  /* ======================================================================
     3. Les premières questions
     ====================================================================== */
  var CLE = 'mylayer.debut';

  function memoriser(champ, valeur) {
    try {
      var d = JSON.parse(localStorage.getItem(CLE) || '{}');
      d[champ] = valeur;
      localStorage.setItem(CLE, JSON.stringify(d));
    } catch (e) { /* navigation privée : tant pis, on n’insiste pas */ }
  }

  function relire() {
    try { return JSON.parse(localStorage.getItem(CLE) || '{}'); }
    catch (e) { return {}; }
  }

  /* Le prénom devient l’adresse : accents retirés, tout en minuscules. */
  function enSlug(txt) {
    return txt
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function brancherDebut() {
    var enregistre = relire();

    /* --- prénom --- */
    var prenom  = document.getElementById('q-prenom');
    var adresse = document.querySelector('[data-adresse]');
    var slug    = document.querySelector('[data-slug]');

    function majPrenom() {
      var s = enSlug(prenom.value.trim());
      if (s) {
        slug.textContent = s;
        adresse.hidden = false;
      } else {
        adresse.hidden = true;
      }
      memoriser('prenom', prenom.value.trim());
    }

    if (prenom) {
      if (enregistre.prenom) prenom.value = enregistre.prenom;
      prenom.addEventListener('input', majPrenom);
      if (prenom.value) majPrenom();
    }

    /* --- âge --- */
    var age = document.getElementById('q-age');
    var val = document.getElementById('q-age-val');
    if (age && val) {
      if (enregistre.age) age.value = enregistre.age;
      val.textContent = age.value;
      age.addEventListener('input', function () {
        val.textContent = age.value;
        memoriser('age', age.value);
      });
    }

    /* --- couleur : le moment où la page change --- */
    var palette   = document.querySelector('[data-palette]');
    var pastilles = palette ? palette.querySelectorAll('.pastille') : [];
    var racine    = document.documentElement;

    function appliquer(trio) {
      var t = trio.split(',');
      racine.style.setProperty('--c', t[0]);
      racine.style.setProperty('--c-deep', t[1]);
      racine.style.setProperty('--c-bright', t[2]);

      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', t[0]);
    }

    for (var i = 0; i < pastilles.length; i++) {
      (function (b) {
        // la pastille se peint avec la couleur qu’elle propose
        b.style.setProperty('--sw', b.getAttribute('data-col').split(',')[0]);

        b.addEventListener('click', function () {
          for (var j = 0; j < pastilles.length; j++) {
            pastilles[j].setAttribute('aria-checked', 'false');
          }
          b.setAttribute('aria-checked', 'true');

          var trio = b.getAttribute('data-col');
          appliquer(trio);
          memoriser('couleur', trio);
        });
      })(pastilles[i]);
    }

    if (enregistre.couleur) {
      appliquer(enregistre.couleur);
      for (var k = 0; k < pastilles.length; k++) {
        if (pastilles[k].getAttribute('data-col') === enregistre.couleur) {
          pastilles[k].setAttribute('aria-checked', 'true');
        }
      }
    }

    /* --- la police : le second choix qui se voit --- */
    var blocPolices = document.querySelector('[data-polices]');
    if (blocPolices) brancherPolices(blocPolices, prenom, enregistre);
  }

  /* ======================================================================
     La police de titre
     Le prénom est déjà posé plus haut : c’est lui qu’on écrit dans les cinq
     fontes, jamais leur nom, qui ne dit rien à personne. S’il manque, un
     mot neutre tient la place.
     ====================================================================== */
  var POLICE_DEFAUT = 'Anton';

  var POLICES_CSS = 'https://fonts.googleapis.com/css2' +
    '?family=Anton' +
    '&family=Climate+Crisis' +
    '&family=Indie+Flower' +
    '&family=Kavoon' +
    '&family=Smokum' +
    '&display=swap';

  var policesDemandees = false;

  /* Cinq fontes au premier affichage ralentiraient toute la page pour une
     question à laquelle la plupart des visiteurs ne descendront jamais. On
     ne les demande qu’en approchant, avec juste assez d’avance pour qu’elles
     soient là quand la question arrive à l’écran. */
  function demanderPolices() {
    if (policesDemandees) return;
    policesDemandees = true;
    var lien = document.createElement('link');
    lien.rel = 'stylesheet';
    lien.href = POLICES_CSS;
    document.head.appendChild(lien);
  }

  /* La classe « p-… » porte les six réglages de la police. La vitrine va
     chercher celle de la tuile cochée : aucune table de correspondance à
     tenir à jour en double, ici et dans la feuille de style. */
  function classePolice(el) {
    var cl = el.className.split(/\s+/);
    for (var i = 0; i < cl.length; i++) {
      if (cl[i].indexOf('p-') === 0) return cl[i];
    }
    return '';
  }

  function brancherPolices(bloc, prenom, enregistre) {
    var typos = bloc.querySelectorAll('.typo');
    var grand = bloc.querySelector('[data-grand]');
    if (!typos.length) return;

    function ecrireApercus() {
      /* Le champ fait foi dès qu’il existe : il a déjà été rempli avec ce que
         la mémoire contenait. Sans lui, on se rabat sur la mémoire. Un champ
         vidé doit redonner le mot neutre, pas l’ancien prénom. */
      var nom = prenom ? prenom.value.trim() : (enregistre.prenom || '');
      if (!nom) nom = 'TON NOM';
      if (grand) grand.textContent = nom;
      for (var i = 0; i < typos.length; i++) {
        var vue = typos[i].querySelector('[data-apercu]');
        if (vue) vue.textContent = nom;
      }
    }

    /* Rend « true » si la police demandée fait bien partie des cinq. */
    function marquer(nom) {
      var trouvee = false;
      for (var i = 0; i < typos.length; i++) {
        var ok = typos[i].getAttribute('data-police') === nom;
        typos[i].setAttribute('aria-checked', ok ? 'true' : 'false');
        if (!ok) continue;
        trouvee = true;
        var vue = typos[i].querySelector('[data-apercu]');
        if (grand && vue) grand.className = 'vitrine__nom ' + classePolice(vue);
      }
      return trouvee;
    }

    for (var p = 0; p < typos.length; p++) {
      (function (b) {
        b.addEventListener('click', function () {
          var nom = b.getAttribute('data-police');
          marquer(nom);
          memoriser('police', nom);
        });
      })(typos[p]);
    }

    /* Anton tant que rien n’a été choisi : la question est obligatoire, aucun
       envoi ne doit partir sans police. C’est la même valeur que porte le
       champ caché du formulaire.
       Un choix gardé d’une visite précédente peut porter le nom d’une police
       qui n’est plus proposée : on le remplace, sur la page comme dans la
       mémoire, sinon l’envoi partirait avec une fonte que le gabarit ne sait
       plus fabriquer. */
    if (!marquer(enregistre.police || POLICE_DEFAUT)) {
      marquer(POLICE_DEFAUT);
      if (enregistre.police) memoriser('police', POLICE_DEFAUT);
    }

    ecrireApercus();
    if (prenom) prenom.addEventListener('input', ecrireApercus);

    if ('IntersectionObserver' in window) {
      var vigie = new IntersectionObserver(function (entrees) {
        for (var v = 0; v < entrees.length; v++) {
          if (!entrees[v].isIntersecting) continue;
          demanderPolices();
          vigie.disconnect();
          return;
        }
      }, { rootMargin: '300px 0px' });
      vigie.observe(bloc);
    } else {
      demanderPolices();
    }
  }

  /* ======================================================================
     1. Apparitions au scroll
     ====================================================================== */
  function observer() {
    if (reduit || !('IntersectionObserver' in window)) {
      toutAfficher();
      return;
    }

    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

    for (var i = 0; i < reveals.length; i++) io.observe(reveals[i]);
  }

  /* ---------------------------------------------------------------------- */
  try {
    observer();
    brancherPage();
    brancherDebut();
  } catch (err) {
    // Un imprévu ne doit jamais laisser la page vide.
    toutAfficher();
  }
})();
