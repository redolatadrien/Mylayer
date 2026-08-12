/* ==========================================================================
   MyLayer — animations d’entrée dans le viewport
   --------------------------------------------------------------------------
   Une seule idée : quand un élément arrive à l’écran, il apparaît. Les cartes
   d’extraits déclenchent en plus leur animation propre (une par bloc).
   Si le JS ne tourne pas ou si l’utilisateur a réduit les animations, tout
   s’affiche normalement — rien n’est jamais masqué durablement.
   ========================================================================== */

(function () {
  'use strict';

  var cibles = document.querySelectorAll('.reveal');

  function toutAfficher() {
    for (var i = 0; i < cibles.length; i++) cibles[i].classList.add('is-visible');
  }

  var reduced = false;
  try {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* vieux navigateur : on continue */ }

  /* --- Repli : pas d’IntersectionObserver, ou animations réduites --- */
  if (reduced || !('IntersectionObserver' in window)) {
    toutAfficher();
    return;
  }

  /* ---------- Compteurs qui montent ---------- */
  var DUREE = 1400; // ms

  function monter(carte) {
    var vals = carte.querySelectorAll('.chiffre-val');

    for (var i = 0; i < vals.length; i++) {
      (function (el) {
        var cible = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(cible)) return;

        var debut = null;
        el.textContent = '0';

        function pas(ts) {
          if (debut === null) debut = ts;
          var t = Math.min((ts - debut) / DUREE, 1);
          var e = 1 - Math.pow(1 - t, 3);           // ease-out cubique
          el.textContent = Math.round(cible * e);
          if (t < 1) requestAnimationFrame(pas);
          else el.textContent = cible;              // valeur exacte à l’arrivée
        }
        requestAnimationFrame(pas);
      })(vals[i]);
    }
  }

  /* ---------- Observation ---------- */
  try {
    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (entree) {
        if (!entree.isIntersecting) return;

        var el = entree.target;
        el.classList.add('is-visible');

        // Le timeline et les trois mots sont pilotés par le CSS via .is-visible.
        // Seuls les compteurs ont besoin de JS.
        if (el.getAttribute('data-anim') === 'chiffres') monter(el);

        observateur.unobserve(el);
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -8% 0px'
    });

    for (var j = 0; j < cibles.length; j++) observateur.observe(cibles[j]);
  } catch (e) {
    // Un imprévu ne doit jamais laisser la page vide.
    toutAfficher();
  }
})();
