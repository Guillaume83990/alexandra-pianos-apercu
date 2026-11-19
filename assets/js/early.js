/* Chargé dans le <head>, avant l'affichage : évite un éclair de la mauvaise palette
   ou de la mauvaise typographie, et prépare les états d'animation (classe « js »).
   Liens directs : ?palette=a|b|c, ?typo=1|2|3, ?intro=1|2|3 (le choix est mémorisé
   pour toutes les pages de la maquette). */
(function () {
  var html = document.documentElement;
  var palettes = { a: 'petrol', b: 'bordeaux', c: 'cobalt' };
  var typos = { '1': 'classique', '2': 'couture', '3': 'contemporaine' };
  var intros = { '1': 'corde', '2': 'touches', '3': 'onde' };

  function valeurs(objet) { return Object.keys(objet).map(function (k) { return objet[k]; }); }
  function lire(cle) { try { return localStorage.getItem(cle); } catch (e) { return null; } }
  function ecrire(cle, v) { try { localStorage.setItem(cle, v); } catch (e) {} }

  var params;
  try { params = new URLSearchParams(location.search); } catch (e) { params = { get: function () { return null; } }; }

  // 19/11/2026 : direction validée par Alexandra (A · Petrol Signature, Classique, 1 · La corde).
  // On l'impose partout, quels que soient le lien ou un ancien choix mémorisé dans le navigateur.
  var palette = 'petrol';
  var typo = 'classique';
  var intro = intros[params.get('intro')] ? 'corde' : null;
  ecrire('ap-palette', palette);
  ecrire('ap-typo', typo);
  ecrire('ap-intro', 'corde');

  if (valeurs(palettes).indexOf(palette) > -1) html.setAttribute('data-palette', palette);
  if (valeurs(typos).indexOf(typo) > -1) html.setAttribute('data-typo', typo);

  html.classList.remove('no-js');
  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  html.classList.add(calme ? 'mouvement-reduit' : 'js');

  // Accueil : l'introduction se joue une fois par visite (ou quand le lien la demande).
  // L'écran reste couvert jusqu'à son lancement, pour ne pas voir la page avant.
  var dejaVue = false;
  try { dejaVue = sessionStorage.getItem('ap-intro-vue') === '1'; } catch (e) {}
  if (!calme && html.getAttribute('data-page') === 'accueil' && (intro || !dejaVue)) html.classList.add('intro-attendue');
})();
