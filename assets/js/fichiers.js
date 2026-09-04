/* ==========================================================================
   MyLayer, le dépôt de photos, partie 2
   --------------------------------------------------------------------------
   1. La référence, qui relie ces photos aux réponses déjà envoyées
   2. La compression, dans le navigateur, avant l’envoi
   3. Les zones de dépôt, les légendes, l’avertissement du portrait
   4. L’envoi

   La compression n’est pas un confort. Le quota Netlify est de dix mégaoctets
   par mois ; une photo de téléphone en pèse trois à cinq. Six photos brutes
   feraient donc sauter le quota d’un seul client. Ramenées à 1600 px de côté
   et exportées en JPEG, elles tombent autour de 350 Ko, et un client complet
   tient largement dedans.

   La page n’est pas un coffre à ouverture unique : elle se remplit autant de
   fois qu’il le faut, et c’est la référence qui relie les envois.
   ========================================================================== */

(function () {
  'use strict';

  var CLE     = 'mylayer.formulaire';
  var COTE    = 1600;   /* le plus grand côté, en pixels */
  var QUALITE = 0.82;   /* au-delà, le gain de poids ne se voit plus */

  var form = document.getElementById('depots');
  if (!form) return;

  function lire(cle) {
    try { return JSON.parse(localStorage.getItem(cle) || '{}'); }
    catch (e) { return {}; }
  }
  var rep = lire(CLE);

  /* ======================================================================
     1. La référence
     Elle vient du lien envoyé par mail, ou du téléphone si c’est le même
     appareil. Elle reste modifiable dans tous les cas : la page peut
     s’ouvrir ailleurs, et un deuxième dépôt peut arriver des semaines plus
     tard, sur un autre navigateur.
     ====================================================================== */
  var champRef = form.querySelector('[data-ref]');

  var reference = '';
  try {
    reference = new URLSearchParams(location.search).get('ref') || '';
  } catch (e) { /* vieux navigateur : on se rabat sur le stockage */ }
  if (!reference) reference = rep.reference || '';
  champRef.value = reference;

  /* ======================================================================
     2. La compression
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

  function versJpeg(img, largeur, hauteur) {
    return new Promise(function (resoudre) {
      var toile = document.createElement('canvas');
      toile.width = largeur; toile.height = hauteur;
      var ctx = toile.getContext('2d');
      /* Un fond blanc : un PNG transparent aplati en JPEG sortirait noir. */
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, largeur, hauteur);
      ctx.drawImage(img, 0, 0, largeur, hauteur);
      toile.toBlob(resoudre, 'image/jpeg', QUALITE);
    });
  }

  function estImage(fichier) {
    return /^image\//.test(fichier.type) || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(fichier.name);
  }
  function estPdf(fichier) {
    return fichier.type === 'application/pdf' || /\.pdf$/i.test(fichier.name);
  }

  /* Un seul passage : 1600 px de côté, qualité 0,82. On ne descend pas plus
     bas pour gratter des kilo-octets, la photo finirait par se voir. Et si
     le résultat pèse plus lourd que l’original, cas d’une petite image déjà
     bien compressée, on garde l’original : recompresser une
     deuxième fois n’ajoute que des artefacts. */
  function alleger(fichier) {
    if (!estImage(fichier)) {
      return Promise.resolve({ blob: fichier, nom: fichier.name, avant: fichier.size });
    }

    return chargerImage(fichier).then(function (img) {
      var ratio = Math.min(1, COTE / Math.max(img.naturalWidth, img.naturalHeight));
      var l = Math.round(img.naturalWidth * ratio);
      var h = Math.round(img.naturalHeight * ratio);

      return versJpeg(img, l, h).then(function (blob) {
        if (!blob) throw new Error('illisible');
        if (blob.size >= fichier.size) {
          return { blob: fichier, nom: fichier.name, avant: fichier.size,
                   large: img.naturalWidth, haut: img.naturalHeight };
        }
        return { blob: blob,
                 nom: fichier.name.replace(/\.[^.]+$/, '') + '.jpg',
                 avant: fichier.size,
                 large: img.naturalWidth, haut: img.naturalHeight };
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
     3. Les zones de dépôt
     ====================================================================== */
  var choisis = {};        /* nom d’emplacement → { blob, nom, avant } */
  var motPoids = form.querySelector('[data-poids]');
  var motEnvoi = form.querySelector('[data-envoi]');
  var bouton   = form.querySelector('[data-envoyer]');
  var reserve  = form.querySelector('[data-legendes]');

  function joliPoids(octets) {
    return octets < 1024 * 1024
      ? Math.round(octets / 1024) + ' Ko'
      : (octets / 1048576).toFixed(1).replace('.', ',') + ' Mo';
  }

  function majPoids() {
    var total = 0, n = 0;
    Object.keys(choisis).forEach(function (s) {
      if (!choisis[s].blob) return;
      total += choisis[s].blob.size; n++;
    });
    if (!n) { motPoids.hidden = true; return; }
    motPoids.hidden = false;
    motPoids.className = 'envoi envoi--poids';
    motPoids.textContent = n + (n > 1 ? ' fichiers, ' : ' fichier, ') + joliPoids(total) + ' en tout.';
  }

  /* Le bouton se ferme tant qu’une photo est encore sur l’établi : envoyée
     à ce moment-là, elle partirait vide. Six images prennent deux à quatre
     secondes sur un téléphone, il faut le dire plutôt que laisser croire
     que la page a planté. */
  function majBouton() {
    var enCours = Object.keys(choisis).filter(function (s) { return !choisis[s].blob; }).length;
    bouton.disabled = enCours > 0;
    if (enCours > 0) {
      motEnvoi.hidden = false;
      motEnvoi.className = 'envoi';
      motEnvoi.textContent = 'Je prépare tes photos…';
    } else if (motEnvoi.textContent === 'Je prépare tes photos…') {
      motEnvoi.hidden = true;
      motEnvoi.textContent = '';
    }
  }

  function brancherZone(zone) {
    var slots     = zone.getAttribute('data-slots').split(',');
    var max       = parseInt(zone.getAttribute('data-max'), 10) || 1;
    var portrait  = zone.hasAttribute('data-portrait');
    var entree    = zone.querySelector('[data-choix]');
    var hote      = zone.parentNode.querySelector('[data-vignettes]');
    var note      = zone.querySelector('.depot__note');
    var noteOrigine = note ? note.textContent : '';

    function libres() {
      return slots.filter(function (s) { return !choisis[s]; });
    }

    entree.addEventListener('change', function () {
      var fichiers = [].slice.call(entree.files || []);
      entree.value = '';                      /* pour pouvoir reprendre la même */
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

        var vignette = document.createElement('figure');
        vignette.className = 'vignette est-en-cours';
        hote.appendChild(vignette);
        majBouton();

        alleger(fichier).then(function (res) {
          choisis[slot] = res;
          vignette.classList.remove('est-en-cours');
          dessinerVignette(vignette, res, slot, portrait);
          majPoids();
          majBouton();
        }).catch(function (err) {
          delete choisis[slot];
          vignette.remove();
          if (note) note.textContent = err.message;
          majPoids();
          majBouton();
        });
      });

      if (fichiers.length > place.length && note) {
        note.textContent = 'J’en ai pris ' + place.length + ' : c’est le maximum ici.';
      }
    });
  }

  function dessinerVignette(vignette, res, slot, portrait) {
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

    /* Le poids avant et après. C’est ce qui rend l’attente compréhensible :
       on voit où sont passées les quatre secondes. La flèche ne s’affiche que
       si les deux poids s’écrivent différemment : sur une petite photo, un
       gain de deux cents octets donnait « 14 Ko → 14 Ko », qui a l’air d’une
       panne plutôt que d’un travail bien fait. */
    var avant = res.avant ? joliPoids(res.avant) : '';
    var apres = joliPoids(res.blob.size);
    var poids = document.createElement('span');
    poids.className = 'vignette__poids';
    poids.textContent = (avant && avant !== apres) ? avant + ' → ' + apres : apres;
    vignette.appendChild(poids);

    /* Le portrait couché. On avertit, on ne bloque pas : une photo de
       travers vaut toujours mieux que pas de photo, et le bloc d’accroche
       est obligatoire. */
    if (portrait && res.haut && res.large && res.haut < res.large) {
      var alerte = document.createElement('p');
      alerte.className = 'vignette__alerte';
      alerte.textContent = 'Cette photo est en largeur. Elle sera mal recadrée. ' +
        'Tu peux quand même l’envoyer, mais une photo verticale rendra beaucoup mieux.';
      vignette.appendChild(alerte);
    }

    /* Un PDF n’a rien à faire ici, mais on ne peut pas savoir à sa place ce
       qu’il contient : on le dit, on laisse faire. */
    if (estPdf(res.blob) || /\.pdf$/i.test(res.nom)) {
      var pdf = document.createElement('p');
      pdf.className = 'vignette__alerte';
      pdf.textContent = 'Un PDF ? Vérifie que ce n’est pas un document officiel. ' +
        'je ne peux rien en faire.';
      vignette.appendChild(pdf);
    }

    /* La légende et le rôle voyagent auprès de leur vignette et retournent
       à leur réserve quand la photo s’en va : leurs champs doivent rester
       dans le formulaire, ce sont eux que Netlify connaît.

       La légende dit ce qu’on voit. Le rôle dit où la poser : la même photo
       d’atelier peut nourrir la galerie, illustrer une étape du parcours ou
       accompagner la fierté, et ces emplacements n’ont pas le même format. */
    var legende = reserve ? reserve.querySelector('[data-legende="' + slot + '"]') : null;
    if (legende) {
      var lab = document.createElement('label');
      lab.className = 'vignette__legende';
      var t = document.createElement('span');
      t.className = 'vignette__legende-titre';
      t.textContent = 'En trois mots, c’est quoi ?';
      lab.appendChild(t);
      lab.appendChild(legende);
      vignette.appendChild(lab);
    }

    var role = reserve ? reserve.querySelector('[data-role="' + slot + '"]') : null;
    if (role) {
      var labR = document.createElement('label');
      labR.className = 'vignette__legende vignette__role';
      var tR = document.createElement('span');
      tR.className = 'vignette__legende-titre';
      tR.textContent = 'Elle va avec quoi ?';
      labR.appendChild(tR);
      labR.appendChild(role);
      vignette.appendChild(labR);
    }

    var retirer = document.createElement('button');
    retirer.type = 'button';
    retirer.className = 'vignette__retirer';
    retirer.innerHTML = '&times;';
    retirer.setAttribute('aria-label', 'retirer ' + res.nom);
    retirer.addEventListener('click', function (e) {
      e.preventDefault();
      delete choisis[slot];
      if (legende) { legende.value = ''; reserve.appendChild(legende); }
      if (role) { role.selectedIndex = 0; reserve.appendChild(role); }
      vignette.remove();
      majPoids();
      majBouton();
    });
    vignette.appendChild(retirer);
  }

  var zones = form.querySelectorAll('[data-zone]');
  for (var z = 0; z < zones.length; z++) brancherZone(zones[z]);

  /* ======================================================================
     4. L’envoi
     Les emplacements déclarés dans le HTML servent à la détection par
     Netlify au déploiement ; le corps envoyé, lui, est construit ici avec
     les versions allégées.
     ====================================================================== */
  var final = document.querySelector('[data-final]');
  var confirmeVide = false;

  bouton.addEventListener('click', function () {
    var noms = Object.keys(choisis).filter(function (s) { return choisis[s].blob; });

    if (!noms.length && !confirmeVide) {
      confirmeVide = true;
      motEnvoi.hidden = false;
      motEnvoi.className = 'envoi';
      motEnvoi.textContent = 'T’as rien déposé. Si c’est voulu, appuie encore une fois, on fera sans.';
      return;
    }

    if (!champRef.value.trim()) {
      motEnvoi.hidden = false;
      motEnvoi.className = 'envoi envoi--rate';
      motEnvoi.textContent = 'Il me manque ta référence : sans elle je ne peux pas rattacher ces photos à tes réponses.';
      return;
    }

    var corps = new FormData();
    corps.append('form-name', 'mylayer-fichiers');
    corps.append('reference', champRef.value.trim());
    noms.forEach(function (slot) {
      corps.append(slot, choisis[slot].blob, choisis[slot].nom);
      var legende = form.querySelector('[data-legende="' + slot + '"]');
      if (legende) corps.append(legende.getAttribute('name'), legende.value.trim());
      var role = form.querySelector('[data-role="' + slot + '"]');
      if (role) corps.append(role.getAttribute('name'), role.value);
    });

    bouton.disabled = true;
    motEnvoi.hidden = false;
    motEnvoi.className = 'envoi';
    motEnvoi.textContent = 'J’envoie…';

    fetch(location.pathname, { method: 'POST', body: corps })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.hidden = true;
        if (final) {
          final.hidden = false;
          var rappel = final.querySelector('[data-ref-rappel]');
          if (rappel) rappel.textContent = champRef.value.trim();
        }
        window.scrollTo(0, 0);
      })
      .catch(function () {
        bouton.disabled = false;
        motEnvoi.className = 'envoi envoi--rate';
        motEnvoi.textContent = 'L’envoi n’est pas passé. Tes photos sont toujours ' +
          'sélectionnées ici, réessaie. Tes réponses, elles, sont déjà arrivées.';
      });
  });

  /* Redéposer, sans recharger : le formulaire revient vide, la référence
     conservée. C’est le chemin normal quand on a plus de six photos. */
  var encore = document.querySelector('[data-encore]');
  if (encore) {
    encore.addEventListener('click', function () {
      Object.keys(choisis).forEach(function (s) { delete choisis[s]; });
      /* Les légendes rentrent d’abord : elles vivent dans les vignettes, et
         vider les vignettes avant les aurait emportées avec. Leurs champs
         doivent rester dans le formulaire, c’est eux que Netlify connaît. */
      var legs = form.querySelectorAll('[data-legende]');
      for (var j = 0; j < legs.length; j++) {
        legs[j].value = '';
        if (reserve) reserve.appendChild(legs[j]);
      }
      var rls = form.querySelectorAll('[data-role]');
      for (var k = 0; k < rls.length; k++) {
        rls[k].selectedIndex = 0;
        if (reserve) reserve.appendChild(rls[k]);
      }
      var vus = form.querySelectorAll('[data-vignettes]');
      for (var i = 0; i < vus.length; i++) vus[i].textContent = '';
      confirmeVide = false;
      bouton.disabled = false;
      motEnvoi.hidden = true;
      motEnvoi.textContent = '';
      majPoids();
      if (final) final.hidden = true;
      form.hidden = false;
      window.scrollTo(0, 0);
    });
  }
})();
