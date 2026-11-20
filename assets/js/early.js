/* Alexandra Pianos · chargé dans le <head>, avant l'affichage.
   Prépare les états d'animation (classe « js » ou « mouvement-reduit ») et l'introduction « La corde »
   (direction validée le 20/11/2026 : couleurs A · Petrol Signature, typographie Classique, introduction La corde).
   L'introduction se joue une fois par visite sur l'accueil ; ?intro=1 la rejoue. */
(function () {
  var html = document.documentElement;
  var params;
  try { params = new URLSearchParams(location.search); } catch (e) { params = { get: function () { return null; } }; }
  try { localStorage.setItem('ap-intro', 'corde'); } catch (e) {}

  html.classList.remove('no-js');
  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  html.classList.add(calme ? 'mouvement-reduit' : 'js');

  // L'écran reste couvert jusqu'au lancement de l'introduction, pour ne pas voir la page avant.
  var dejaVue = false;
  try { dejaVue = sessionStorage.getItem('ap-intro-vue') === '1'; } catch (e) {}
  if (!calme && html.getAttribute('data-page') === 'accueil' && (params.get('intro') || !dejaVue)) html.classList.add('intro-attendue');
})();
