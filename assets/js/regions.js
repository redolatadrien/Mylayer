/* ==========================================================================
   MyLayer, les régions proches
   --------------------------------------------------------------------------
   La liste de celui qui n’a pas voyagé. Répondre « non » à la question du
   voyage fermait tout et faisait disparaître le bloc carte de sa page : le
   gabarit prévoit pourtant une carte locale, qui attend des régions au lieu
   de pays.

   Trois familles, dans cet ordre : les 26 cantons sous leur nom complet en
   français, les régions frontalières où l’on va vraiment, et les régions
   suisses non cantonales que les gens nomment d’eux-mêmes. La Gruyère ou
   l’Emmental ne sont pas des cantons, mais personne ne dit « Fribourg »
   quand il veut dire la Gruyère.

   Pas de code ici, contrairement aux pays : il n’existe pas de norme qui
   couvre à la fois un canton, un département français et l’Oberland
   bernois. Le nom fait donc l’identité, et c’est lui qui est stocké.
   ========================================================================== */

window.MYLAYER_REGIONS = (
  /* les 26 cantons */
  'Argovie|Appenzell Rhodes-Extérieures|Appenzell Rhodes-Intérieures|'
+ 'Bâle-Campagne|Bâle-Ville|Berne|Fribourg|Genève|Glaris|Grisons|Jura|'
+ 'Lucerne|Neuchâtel|Nidwald|Obwald|Saint-Gall|Schaffhouse|Schwyz|Soleure|'
+ 'Thurgovie|Tessin|Uri|Valais|Vaud|Zoug|Zurich|'
  /* les régions frontalières usuelles */
+ 'Haute-Savoie|Savoie|Ain|Doubs|Jura français|Alsace|Bade-Wurtemberg|'
+ 'Vorarlberg|Val d’Aoste|Lombardie|Piémont|'
  /* les régions suisses qu’on nomme sans passer par le canton */
+ 'la Gruyère|le Chablais|la Broye|l’Emmental|l’Oberland bernois|'
+ 'l’Engadine|le Tessin méridional'
).split('|').map(function (nom) { return { nom: nom }; });
