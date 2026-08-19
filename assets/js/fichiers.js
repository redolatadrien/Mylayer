/* ==========================================================================
   MyLayer — le dépôt de fichiers, partie 2
   --------------------------------------------------------------------------
   1. La référence, qui rattache ces photos aux réponses déjà envoyées
   2. Les cases conditionnelles, tirées de ce qui a été répondu
   3. La compression, avant l’envoi et sur le téléphone
   4. L’envoi

   La compression n’est pas un confort : une photo de téléphone pèse 2 à 4 Mo,
   trois suffiraient à épuiser le quota mensuel de fichiers. Allégées à
   300-400 Ko, un client complet tient sous le mégaoctet. C’est ce qui rend
   le circuit tenable, pas ce qui le rend joli.
   ========================================================================== */

(function () {
  'use strict';

  var CLE   = 'mylayer.formulaire';
  var CIBLE = 380 * 1024;   /* le poids visé par photo, une fois allégée */
  var COTE  = 1600;         /* le plus grand côté, en pixels */

  var form = document.getElementById('depots');
  if (!form) return;

  function lire(cle) {
    try { return JSON.parse(localStorage.getItem(cle) || '{}'); }
    catch (e) { return {}; }
  }
  var rep = lire(CLE);

  /* ======================================================================
     1 — La référence
     Elle vient du lien envoyé par mail, ou du téléphone si c’est le même
     appareil. Si elle manque — page ouverte ailleurs, lien recopié de
     travers — on la demande plutôt que d’envoyer des photos orphelines.
     ====================================================================== */
  var champRef    = form.querySelector('[data-ref]');
  var champPrenom = form.querySelector('[data-prenom]');
  var champMail   = form.querySelector('[data-mail]');

  var reference = '';
  try {
    reference = new URLSearchParams(location.search).get('ref') || '';
  } catch (e) { /* vieux navigateur : on se rabat sur le stockage */ }
  if (!reference) reference = rep.reference || '';

  champRef.value    = reference;
  champPrenom.value = rep.prenom || '';
  champMail.value   = rep.mail || '';

  var blocRef  = form.querySelector('[data-bloc-ref]');
  var sansRef  = form.querySelector('[data-sans-ref]');
  var refMain  = form.querySelector('[data-ref-main]');

  if (reference) {
    blocRef.hidden = false;
    form.querySelector('[data-ref-code]').textContent = reference;
  } else {
    sansRef.hidden = false;
    refMain.hidden = false;
    document.getElementById('c-ref').addEventListener('input', function () {
      champRef.value = this.value.trim();
    });
  }

  /* ======================================================================
     2 — Les cases conditionnelles
     Elles reprennent ce qui a été répondu : « une photo de ça ? » n’a de
     sens que si l’on sait de quoi. Sur un autre appareil, le stockage est
     vide et la page s’en tient aux trois cases fixes.
     ====================================================================== */
  function extrait(texte) {
    var t = String(texte || '').replace(/\s+/g, ' ').trim();
    return t.length > 90 ? t.slice(0, 88).replace(/[\s,;.]+$/, '') + '…' : t;
  }

  var LIEES = [
    { si: function () { return !!rep.lieux_qui_comptent; },
      slot: 'photo_lieu',
      titre: 'Une photo de ça ?',
      note: function () { return 'Tu m’as dit : « ' + extrait(rep.lieux_qui_comptent) + ' »'; },
      accepte: 'image/*' },

    { si: function () { return rep.a_voyage === 'oui' || !!rep.pays; },
      slot: 'photo_voyage',
      titre: 'Une photo d’un de tes voyages ?',
      note: function () {
        return rep.pays ? 'Tu as coché : ' + extrait(rep.pays)
                        : 'Celle que tu veux.';
      },
      accepte: 'image/*' },

    { si: function () { return rep.a_projet === 'oui'; },
      slot: 'photo_projet',
      titre: 'Une photo de ton projet ?',
      note: function () { return rep.projet ? 'Tu m’as dit : « ' + extrait(rep.projet) + ' »' : 'Celle que tu veux.'; },
      accepte: 'image/*' },

    { si: function () { return !!rep.temps_libre; },
      slot: 'photo_activite',
      titre: 'Une photo de toi en train de faire ça ?',
      note: function () { return 'Tu m’as dit : « ' + extrait(rep.temps_libre) + ' »'; },
      accepte: 'image/*' }
  ];

  (function construireCasesLiees() {
    var hote = form.querySelector('[data-cases-liees]');
    if (!hote) return;
    var lettre = 'D'.charCodeAt(0);

    LIEES.forEach(function (cas) {
      if (!cas.si()) return;

      var section = document.createElement('section');
      section.className = 'case';

      var l = document.createElement('p');
      l.className = 'case__lettre';
      l.textContent = String.fromCharCode(lettre++);

      var t = document.createElement('h2');
      t.className = 'case__titre';
      t.textContent = cas.titre;

      var n = document.createElement('p');
      n.className = 'case__note';
      n.textContent = cas.note();

      var zone = document.createElement('label');
      zone.className = 'depot';
      zone.setAttribute('data-zone', '');
      zone.setAttribute('data-slots', cas.slot);
      zone.setAttribute('data-max', '1');

      var entree = document.createElement('input');
      entree.type = 'file';
      entree.accept = cas.accepte;
      entree.setAttribute('data-choix', '');

      var zt = document.createElement('span');
      zt.className = 'depot__titre';
      zt.textContent = 'Choisir une photo';

      var zn = document.createElement('span');
      zn.className = 'depot__note';
      zn.textContent = 'Si t’as pas, laisse vide.';

      zone.appendChild(entree); zone.appendChild(zt); zone.appendChild(zn);

      var vign = document.createElement('div');
      vign.className = 'vignettes';
      vign.setAttribute('data-vignettes', '');

      section.appendChild(l); section.appendChild(t); section.appendChild(n);
      section.appendChild(zone); section.appendChild(vign);
      hote.appendChild(section);
    });
  })();

  /* ======================================================================
     3 — La compression
     ====================================================================== */

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
    return /^image\//.test(fichier.type) || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(fichier.name);
  }

  /* On descend la qualité par paliers, puis la taille si ça ne suffit pas.
     Une photo de portrait bien exposée tombe sous la cible dès le deuxième
     palier ; les captures d’écran très détaillées vont jusqu’au bout. */
  function alleger(fichier) {
    if (!estImage(fichier)) {
      return Promise.resolve({ blob: fichier, nom: fichier.name });
    }

    return chargerImage(fichier).then(function (img) {
      var ratio = Math.min(1, COTE / Math.max(img.naturalWidth, img.naturalHeight));
      var l = Math.round(img.naturalWidth * ratio);
      var h = Math.round(img.naturalHeight * ratio);

      var qualites = [0.82, 0.72, 0.62, 0.52, 0.44];
      var i = 0;

      function essai(largeur, hauteur) {
        return versJpeg(img, largeur, hauteur, qualites[i]).then(function (blob) {
          if (!blob) throw new Error('illisible');
          if (blob.size <= CIBLE) return blob;
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
        var nom = fichier.name.replace(/\.[^.]+$/, '') + '.jpg';
        return { blob: blob, nom: nom };
      });
    }).catch(function () {
      /* Le cas connu : les iPhone photographient en HEIC, que les
         navigateurs de bureau ne savent pas ouvrir. Sur l’iPhone lui-même
         Safari le décode et on ne passe jamais ici. */
      var heic = /\.(heic|heif)$/i.test(fichier.name);
      throw new Error(heic
        ? 'Cette photo est en HEIC, un format que ce navigateur ne sait pas ouvrir. Envoie-la depuis ton téléphone, ou passe l’appareil photo en « Plus compatible » (Réglages → Appareil photo → Formats).'
        : 'Je n’arrive pas à ouvrir ce fichier. Essaie une autre photo.');
    });
  }

  /* ======================================================================
     Les zones de dépôt
     ====================================================================== */
  var choisis = {};        /* nom d’emplacement → { blob, nom } */
  var motPoids = form.querySelector('[data-poids]');

  function joliPoids(octets) {
    return octets < 1024 * 1024
      ? Math.round(octets / 1024) + ' Ko'
      : (octets / 1048576).toFixed(1).replace('.', ',') + ' Mo';
  }

  function majPoids() {
    var total = 0, n = 0;
    Object.keys(choisis).forEach(function (s) { total += choisis[s].blob.size; n++; });
    if (!n) { motPoids.hidden = true; return; }
    motPoids.hidden = false;
    motPoids.className = 'envoi envoi--poids';
    motPoids.textContent = n + (n > 1 ? ' fichiers, ' : ' fichier, ') + joliPoids(total) + ' en tout.';
  }

  function brancherZone(zone) {
    var slots = zone.getAttribute('data-slots').split(',');
    var max = parseInt(zone.getAttribute('data-max'), 10) || 1;
    var entree = zone.querySelector('[data-choix]');
    var hote = zone.parentNode.querySelector('[data-vignettes]');
    var note = zone.querySelector('.depot__note');
    var noteOrigine = note ? note.textContent : '';

    function libres() {
      return slots.filter(function (s) { return !choisis[s]; });
    }

    entree.addEventListener('change', function () {
      var fichiers = [].slice.call(entree.files || []);
      entree.value = '';                      /* pour pouvoir reprendre le même */
      if (!fichiers.length) return;

      var place = libres();
      if (!place.length) {
        if (note) note.textContent = 'C’est complet (' + max + ' au maximum). Retire-en une d’abord.';
        return;
      }
      if (note) note.textContent = noteOrigine;

      fichiers.slice(0, place.length).forEach(function (fichier, k) {
        var slot = place[k];
        choisis[slot] = { blob: null, nom: fichier.name };   /* on réserve la place */

        var vignette = document.createElement('div');
        vignette.className = 'vignette est-en-cours';
        hote.appendChild(vignette);

        alleger(fichier).then(function (res) {
          choisis[slot] = res;
          vignette.classList.remove('est-en-cours');
          dessinerVignette(vignette, res, slot, hote);
          majPoids();
        }).catch(function (err) {
          delete choisis[slot];
          vignette.remove();
          if (note) note.textContent = err.message;
          majPoids();
        });
      });

      if (fichiers.length > place.length && note) {
        note.textContent = 'J’en ai pris ' + place.length + ' : c’est le maximum ici.';
      }
    });
  }

  function dessinerVignette(vignette, res, slot, hote) {
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
      delete choisis[slot];
      vignette.remove();
      majPoids();
    });
    vignette.appendChild(retirer);
  }

  var zones = form.querySelectorAll('[data-zone]');
  for (var z = 0; z < zones.length; z++) brancherZone(zones[z]);

  /* ======================================================================
     4 — L’envoi
     Les emplacements déclarés dans le HTML servent à la détection par
     Netlify au déploiement ; le corps envoyé, lui, est construit ici avec
     les versions allégées.
     ====================================================================== */
  var motEnvoi = form.querySelector('[data-envoi]');
  var bouton = form.querySelector('[data-envoyer]');
  var final = document.querySelector('[data-final]');
  var confirmeVide = false;

  bouton.addEventListener('click', function () {
    var noms = Object.keys(choisis).filter(function (s) { return choisis[s].blob; });
    var enCours = Object.keys(choisis).length - noms.length;

    if (enCours > 0) {
      motEnvoi.hidden = false;
      motEnvoi.className = 'envoi';
      motEnvoi.textContent = 'J’allège encore ' + enCours +
        (enCours > 1 ? ' photos' : ' photo') + ', deux secondes.';
      return;
    }

    if (!noms.length && !confirmeVide) {
      confirmeVide = true;
      motEnvoi.hidden = false;
      motEnvoi.className = 'envoi';
      motEnvoi.textContent = 'T’as rien déposé. Si c’est voulu, appuie encore une fois — on fera sans.';
      return;
    }

    if (!champRef.value) {
      motEnvoi.hidden = false;
      motEnvoi.className = 'envoi envoi--rate';
      motEnvoi.textContent = 'Il me manque ta référence : sans elle je ne peux pas rattacher ces photos à tes réponses.';
      return;
    }

    var corps = new FormData();
    corps.append('form-name', 'mylayer-fichiers');
    corps.append('reference', champRef.value);
    corps.append('prenom', champPrenom.value);
    corps.append('mail', champMail.value);
    noms.forEach(function (slot) {
      corps.append(slot, choisis[slot].blob, choisis[slot].nom);
    });

    bouton.disabled = true;
    motEnvoi.hidden = false;
    motEnvoi.className = 'envoi';
    motEnvoi.textContent = 'J’envoie…';

    fetch(location.pathname, { method: 'POST', body: corps })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.hidden = true;
        if (final) final.hidden = false;
        window.scrollTo(0, 0);
      })
      .catch(function () {
        bouton.disabled = false;
        motEnvoi.className = 'envoi envoi--rate';
        motEnvoi.textContent = 'L’envoi n’est pas passé. Tes photos sont toujours ' +
          'sélectionnées ici — réessaie. Tes réponses, elles, sont déjà arrivées.';
      });
  });
})();
