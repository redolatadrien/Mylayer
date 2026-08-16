/* ==========================================================================
   MyLayer — comportements de la page d’accueil
   --------------------------------------------------------------------------
   1. Apparitions au scroll
   2. Compteurs qui montent
   3. Carte du monde qui se remplit pays par pays
   4. Fiche qui défile dans le téléphone
   5. Les premières questions : prénom, âge, couleur — et la page se repeint
   6. Carte de visite qui se retourne
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
     2 — Compteurs
     ====================================================================== */
  var DUREE = 1500;

  function monter(portee) {
    var vals = portee.querySelectorAll('[data-count]');
    for (var i = 0; i < vals.length; i++) {
      (function (el) {
        if (el.dataset.compte === 'fait') return;
        el.dataset.compte = 'fait';

        var cible = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(cible)) return;

        var debut = null;

        function pas(ts) {
          // On ne remet à zéro qu’au premier rendu : si rAF ne démarre jamais
          // (onglet en arrière-plan), la vraie valeur reste affichée.
          if (debut === null) { debut = ts; }
          var t = Math.min((ts - debut) / DUREE, 1);
          el.textContent = Math.round(cible * (1 - Math.pow(1 - t, 3)));
          if (t < 1) requestAnimationFrame(pas);
          else el.textContent = cible;
        }
        requestAnimationFrame(pas);
      })(vals[i]);
    }
  }

  /* ======================================================================
     3 — Carte du monde
     Les pays s’allument un par un, dans un ordre volontairement irrégulier
     pour que ça ressemble à un parcours et pas à un balayage.
     ====================================================================== */
  /* 16 pays, et 16 chemins réellement présents dans le SVG : le compteur
     annonce 16, il faut que 16 s’allument. (Hong Kong est fondu dans la
     Chine sur cette carte — inutilisable ici.) */
  var PAYS = ['ma', 'ch', 'th', 'ae', 'fr', 'de', 'pt', 'es',
              'it', 'nl', 'dk', 'se', 'be', 'ca', 'us', 'vn'];

  function remplirCarte(bloc) {
    if (bloc.dataset.rempli === 'oui') return;
    bloc.dataset.rempli = 'oui';

    var svg = bloc.querySelector('svg');
    if (!svg) return;

    PAYS.forEach(function (code, i) {
      var el = svg.querySelector('#' + code);
      if (!el) return;
      setTimeout(function () { el.classList.add('visited'); }, 140 + i * 110);
    });
  }

  /* ======================================================================
     4 — La fiche défile dans le téléphone
     Le contenu monte à mesure que le téléphone traverse l’écran : on voit
     que c’est une vraie page, pas une image.
     ====================================================================== */
  function brancherTelephone() {
    var phone = document.querySelector('[data-phone]');
    var piste = document.querySelector('[data-phone-scroll]');
    if (!phone || !piste || reduit) return;

    var ecran = phone.querySelector('.phone__screen');
    var tick = false;

    function placer() {
      tick = false;
      var r = phone.getBoundingClientRect();
      var course = piste.scrollHeight - ecran.clientHeight;
      if (course <= 0) return;

      // 0 quand le téléphone entre par le bas, 1 quand il sort par le haut
      var p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
      p = Math.max(0, Math.min(1, p));
      piste.style.transform = 'translateY(' + (-course * p) + 'px)';
    }

    function auScroll() {
      if (tick) return;
      tick = true;
      requestAnimationFrame(placer);
    }

    window.addEventListener('scroll', auScroll, { passive: true });
    window.addEventListener('resize', auScroll);
    placer();
  }

  /* ======================================================================
     4 bis — La fiche d’Adrien, dans le grand téléphone
     Le défilement lui-même est purement CSS (overflow-y: auto) : c’est le
     visiteur qui l’actionne, et le navigateur rend la main à la page une
     fois la fiche au bout. On ne s’occupe ici que du dégradé du bas, qui
     s’efface quand il n’y a plus rien à lire — sans JS, il reste affiché,
     ce qui n’enlève rien.
     ====================================================================== */
  function brancherFiche() {
    var fiche = document.querySelector('[data-fiche]');
    if (!fiche) return;

    var tick = false;

    function jauger() {
      tick = false;
      var reste = fiche.scrollHeight - fiche.scrollTop - fiche.clientHeight;
      fiche.classList.toggle('est-au-bout', reste < 12);
    }

    fiche.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(jauger);
    }, { passive: true });

    window.addEventListener('resize', jauger);
    // Les photos arrivent en différé : chacune rallonge la fiche.
    window.addEventListener('load', jauger);
    jauger();
  }

  /* ======================================================================
     5 — Les premières questions
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
      majBascule();
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
          majBascule();
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

    /* --- la bascule : elle n’apparaît qu’une fois les trois choses faites --- */
    var bascule = document.querySelector('[data-bascule]');
    var bonjour = document.querySelector('[data-bonjour]');

    function majBascule() {
      if (!bascule) return;
      var d = relire();
      var pret = d.prenom && d.prenom.length > 0 && d.couleur;

      if (pret && bascule.hidden) {
        bascule.hidden = false;
        bascule.classList.add('reveal', 'is-in');
      }
      if (bonjour && d.prenom) {
        bonjour.innerHTML = '<b>Voilà, ' + d.prenom.replace(/</g, '&lt;') +
                            '.</b> Ta fiche a déjà une couleur et une adresse. ';
      }
    }

    majBascule();
  }

  /* ======================================================================
     6 — La carte de visite se retourne (le survol suffit à la souris,
         le tap est nécessaire au doigt)
     ====================================================================== */
  function brancherCarte() {
    var carte = document.querySelector('.carte3d');
    if (!carte) return;

    function retourner() { carte.classList.toggle('is-flipped'); }

    carte.addEventListener('click', retourner);
    carte.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); retourner(); }
    });
  }

  /* ======================================================================
     1 — Apparitions au scroll (et déclencheurs des animations de bloc)
     ====================================================================== */
  function observer() {
    if (reduit || !('IntersectionObserver' in window)) {
      toutAfficher();
      document.querySelectorAll('[data-map]').forEach(remplirCarte);
      document.querySelectorAll('[data-count]').forEach(function (el) {
        el.textContent = el.getAttribute('data-count');
      });
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

    /* déclencheurs propres à certains blocs */
    var blocs = document.querySelectorAll('[data-map], [data-stats], [data-tl], .f-sub');
    var io2 = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        if (el.hasAttribute('data-map')) remplirCarte(el);
        else if (el.hasAttribute('data-tl')) el.classList.add('is-in');
        else monter(el);
        io2.unobserve(el);
      });
    }, { threshold: 0.25 });

    for (var j = 0; j < blocs.length; j++) io2.observe(blocs[j]);
  }

  /* ---------------------------------------------------------------------- */
  try {
    observer();
    brancherTelephone();
    brancherFiche();
    brancherDebut();
    brancherCarte();
  } catch (err) {
    // Un imprévu ne doit jamais laisser la page vide.
    toutAfficher();
  }
})();
