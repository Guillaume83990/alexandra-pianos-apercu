/* Alexandra Pianos · maquette de direction artistique
   1. Bandeau : palettes, typographies, introductions   2. Menu, FR / EN, formulaire (maquette)
   3. Animations du site : corde, touches, ondes, photos, titres (GSAP + ScrollTrigger)
   4. Les trois introductions (jouées à l'arrivée sur l'accueil, ou depuis le bandeau) */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduit = html.classList.contains('mouvement-reduit');
  var bulle = document.querySelector('[data-bulle]');
  var minuterieBulle;

  function afficherBulle(texte) {
    if (!bulle) return;
    bulle.textContent = texte;
    bulle.classList.add('visible');
    clearTimeout(minuterieBulle);
    minuterieBulle = setTimeout(function () { bulle.classList.remove('visible'); }, 4200);
  }
  function lire(cle) { try { return localStorage.getItem(cle); } catch (e) { return null; } }
  function ecrire(cle, v) { try { localStorage.setItem(cle, v); } catch (e) {} }

  /* ---------- 1. Bandeau : palettes, typographies, introductions ---------- */
  var CODES = {
    palette: { petrol: 'a', bordeaux: 'b', cobalt: 'c' },
    typo: { classique: '1', couture: '2', contemporaine: '3' },
    intro: { corde: '1', touches: '2', onde: '3' }
  };
  var POLICES_TYPO = {
    classique: ['300 40px "Cormorant Garamond"', 'italic 300 40px "Cormorant Garamond"', '400 16px "Manrope"'],
    couture: ['400 40px "Bodoni Moda"', 'italic 400 40px "Bodoni Moda"', '400 16px "Jost"'],
    contemporaine: ['500 40px "Cabinet Grotesk"', '400 16px "Switzer"', '500 16px "Switzer"']
  };
  var boutons = {
    palette: document.querySelectorAll('[data-choix]'),
    typo: document.querySelectorAll('[data-typo-choix]'),
    intro: document.querySelectorAll('[data-intro-choix]')
  };
  var ATTRIBUTS = { palette: 'data-choix', typo: 'data-typo-choix', intro: 'data-intro-choix' };

  function marquer(groupe, nom) {
    boutons[groupe].forEach(function (b) {
      var actif = b.getAttribute(ATTRIBUTS[groupe]) === nom;
      b.setAttribute('aria-checked', actif ? 'true' : 'false');
      if (actif) {
        var etiquette = document.querySelector('[data-actif="' + groupe + '"]');
        if (etiquette) etiquette.textContent = b.getAttribute('data-nom');
      }
    });
  }

  function memoriser(groupe, nom) {
    ecrire('ap-' + groupe, nom);
    try {
      var url = new URL(location.href);
      url.searchParams.set(groupe, CODES[groupe][nom]);
      history.replaceState(null, '', url);
    } catch (e) {}
  }

  var minuteriePalette;
  function choisirPalette(nom) {
    if (html.getAttribute('data-palette') === nom) return;
    html.classList.add('changement-palette');
    html.setAttribute('data-palette', nom);
    marquer('palette', nom);
    memoriser('palette', nom);
    clearTimeout(minuteriePalette);
    minuteriePalette = setTimeout(function () { html.classList.remove('changement-palette'); }, 950);
    pincerCordesVisibles();
  }

  function choisirTypo(nom) {
    if (html.getAttribute('data-typo') === nom) return;
    marquer('typo', nom);
    memoriser('typo', nom);
    var zones = document.querySelectorAll('main, .entete, .pied');
    var appliquer = function () {
      // Les polices sont chargées avant le changement : pas de texte qui « saute »
      var bascule = function () {
        html.setAttribute('data-typo', nom);
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        pincerCordesVisibles();
      };
      if (window.gsap && !reduit) {
        window.gsap.to(zones, { opacity: 0, duration: 0.22, ease: 'power1.in', onComplete: function () {
          bascule();
          window.gsap.to(zones, { opacity: 1, duration: 0.55, ease: 'power2.out', clearProps: 'opacity' });
        } });
      } else {
        bascule();
      }
    };
    if (document.fonts && document.fonts.load) {
      Promise.all(POLICES_TYPO[nom].map(function (f) { return document.fonts.load(f); })).then(appliquer, appliquer);
    } else {
      appliquer();
    }
  }

  function introChoisie() {
    var v = lire('ap-intro');
    return CODES.intro[v] ? v : 'corde';
  }
  function choisirIntro(nom) {
    marquer('intro', nom);
    memoriser('intro', nom);
    jouerIntro(nom, false);
  }

  var CHOISIR = { palette: choisirPalette, typo: choisirTypo, intro: choisirIntro };
  Object.keys(boutons).forEach(function (groupe) {
    var liste = Array.prototype.slice.call(boutons[groupe]);
    liste.forEach(function (b) {
      b.addEventListener('click', function () { CHOISIR[groupe](b.getAttribute(ATTRIBUTS[groupe])); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        var i = liste.indexOf(b) + (e.key === 'ArrowRight' ? 1 : -1);
        var cible = liste[(i + liste.length) % liste.length];
        cible.focus();
        CHOISIR[groupe](cible.getAttribute(ATTRIBUTS[groupe]));
      });
    });
  });
  marquer('palette', html.getAttribute('data-palette') || 'petrol');
  marquer('typo', html.getAttribute('data-typo') || 'classique');
  marquer('intro', introChoisie());
  var revoir = document.querySelector('[data-revoir]');
  if (revoir) revoir.addEventListener('click', function () { jouerIntro(introChoisie(), false); });

  // Le bandeau peut changer de hauteur : l'en-tête se cale juste dessous
  var bandeau = document.querySelector('.presentation');
  function caler() { if (bandeau) html.style.setProperty('--bandeau', Math.round(bandeau.getBoundingClientRect().height) + 'px'); }
  caler();
  if (bandeau && window.ResizeObserver) new ResizeObserver(caler).observe(bandeau);

  /* ---------- 2. Menu téléphone, FR / EN, mentions, formulaire ---------- */
  var burger = document.querySelector('[data-burger]');
  var menuMobile = document.getElementById('menu-mobile');
  if (burger && menuMobile) {
    burger.addEventListener('click', function () {
      var ouvert = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', ouvert ? 'false' : 'true');
      menuMobile.hidden = ouvert;
    });
  }

  var boutonEN = document.querySelector('[data-langue="en"]');
  if (boutonEN) {
    boutonEN.addEventListener('click', function () {
      afficherBulle('Version anglaise : chaque page sera traduite et relue avec vous, une fois les textes français validés.');
    });
  }
  document.querySelectorAll('[data-bientot="mentions"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      afficherBulle('Les mentions légales (incluses au devis) seront rédigées pour la mise en ligne.');
    });
  });

  var formulaire = document.querySelector('[data-formulaire]');
  if (formulaire) {
    formulaire.addEventListener('submit', function (e) {
      e.preventDefault();
      var retour = formulaire.querySelector('.formulaire__retour');
      if (retour) retour.textContent = 'Maquette : sur le site, votre demande arrivera directement dans votre boîte Gmail.';
    });
  }

  /* ---------- 3. Animations du site ---------- */
  var cordes = [];
  function pincerCordesVisibles() {
    cordes.forEach(function (c) {
      var r = c.svg.getBoundingClientRect();
      if (c.tendue && r.bottom > 0 && r.top < window.innerHeight) c.pincer(4);
    });
  }

  var ondes = document.querySelector('[data-ondes]');
  var cheminsOndes = ondes ? ondes.querySelectorAll('path') : [];
  var LARGEUR = 1440, HAUTEUR = 160;
  function dessinerOndes(phase, ampleur) {
    for (var n = 0; n < cheminsOndes.length; n++) {
      var d = '';
      var freq = 0.0042 + n * 0.0011;
      var decalage = n * 0.9;
      var amp = ampleur * (1 - n * 0.16);
      for (var x = 0; x <= LARGEUR; x += 16) {
        var enveloppe = Math.sin(Math.PI * x / LARGEUR);
        var y = HAUTEUR / 2 + amp * enveloppe * Math.sin(x * freq + phase * (1 + n * 0.22) + decalage);
        d += (x === 0 ? 'M' : 'L') + x + ' ' + y.toFixed(2) + ' ';
      }
      cheminsOndes[n].setAttribute('d', d);
    }
  }

  var intro = document.querySelector('[data-intro]');

  // Sans GSAP ou avec « mouvement réduit » : tout est visible, rien ne bouge, pas d'introduction
  if (!window.gsap || !window.ScrollTrigger || reduit) {
    html.classList.remove('js', 'intro-attendue');
    dessinerOndes(0.6, 26);
    window.jouerIntro = jouerIntro;
    return;
  }

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);
  var ST = window.ScrollTrigger;

  /* La corde : elle se tend, vibre, puis se pose */
  function creerCorde(svg) {
    var chemin = svg.querySelector('path');
    var etat = { amp: 0, t: 0 };
    function rendre() {
      var y = 12 + etat.amp * Math.sin(etat.t * Math.PI * 2 * 7);
      chemin.setAttribute('d', 'M0 12 Q300 ' + y.toFixed(2) + ' 600 12');
    }
    function pincer(force) {
      gsap.killTweensOf(etat);
      gsap.fromTo(etat, { t: 0 }, { t: 1.8, duration: 1.8, ease: 'none', onUpdate: function () {
        etat.amp = force * Math.pow(1 - etat.t / 1.8, 3);  // la vibration s'éteint doucement
        rendre();
      } });
    }
    var corde = { svg: svg, chemin: chemin, pincer: pincer, tendue: false };
    var titre = svg.parentElement.querySelector('.titre');
    if (titre) titre.addEventListener('mouseenter', function () { if (corde.tendue) pincer(3.5); });
    cordes.push(corde);
    return corde;
  }

  function tendreCorde(corde, delai) {
    return gsap.timeline({ delay: delai || 0 })
      .to(corde.chemin, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' })
      .add(function () { corde.tendue = true; corde.pincer(7); }, '-=0.08');
  }

  /* Les titres montent ligne par ligne */
  function leverTitre(titre, delai) {
    var lignes = titre.querySelectorAll('.ligne > span');
    gsap.set(lignes, { yPercent: 105, y: 0 });
    return gsap.to(lignes, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.12, delay: delai || 0 });
  }

  /* Révélation photographique + profondeur au défilement */
  function revelerPhoto(figure, delai) {
    var img = figure.querySelector('img');
    gsap.fromTo(img, { opacity: 0, scale: 1.16, y: 40 },
      { opacity: 1, scale: 1.08, y: 0, duration: 1.9, ease: 'expo.out', delay: delai || 0 });
    gsap.fromTo(img, { yPercent: 3 }, { yPercent: -3, ease: 'none',
      scrollTrigger: { trigger: figure, start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  function apparaitre(elements, delai) {
    return gsap.fromTo(elements, { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: delai || 0 });
  }

  /* ---- Ouverture de l'accueil (après l'introduction) ---- */
  var hero = document.querySelector('.hero');
  var accueilLance = false;
  var cordeHero = hero ? creerCorde(hero.querySelector('[data-corde]')) : null;
  function lancerAccueil() {
    if (!hero || accueilLance) return;
    accueilLance = true;
    var touches = hero.querySelectorAll('[data-touches] i');
    leverTitre(hero.querySelector('[data-lignes]'), 0.15);
    tendreCorde(cordeHero, 0.65);
    apparaitre(hero.querySelectorAll('.hero__texte [data-apparition]'), 0.05);
    revelerPhoto(hero.querySelector('[data-photo]'), 0.25);
    gsap.to(touches, { scaleY: 1, duration: 1.1, ease: 'power3.out', stagger: 0.09, delay: 1 });
    gsap.to(touches, { y: function (i) { return (i % 3) * -14 - 8; }, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    apparaitre(hero.querySelectorAll('.hero__visuel [data-apparition]'), 1.2);
  }
  if (hero) gsap.set(hero.querySelectorAll('.ligne > span'), { yPercent: 105, y: 0 });

  /* ---- Hors de l'accueil : chaque corde se tend, chaque titre monte, chaque photo se révèle à son arrivée ---- */
  var horsHero = function (el) { return !(hero && hero.contains(el)) && !(intro && intro.contains(el)); };
  document.querySelectorAll('[data-corde]').forEach(function (svg) {
    if (!horsHero(svg)) return;
    var corde = creerCorde(svg);
    ST.create({ trigger: svg, start: 'top 88%', once: true, onEnter: function () { tendreCorde(corde, 0); } });
  });
  document.querySelectorAll('[data-lignes]').forEach(function (titre) {
    if (!horsHero(titre)) return;
    gsap.set(titre.querySelectorAll('.ligne > span'), { yPercent: 105, y: 0 });
    ST.create({ trigger: titre, start: 'top 90%', once: true, onEnter: function () { leverTitre(titre, 0.3); } });
  });
  document.querySelectorAll('[data-photo]').forEach(function (photo) {
    if (!horsHero(photo)) return;
    gsap.set(photo.querySelector('img'), { opacity: 0 });
    ST.create({ trigger: photo, start: 'top 90%', once: true, onEnter: function () { revelerPhoto(photo, 0); } });
  });

  /* ---- Textes et listes, par petits groupes ---- */
  var autres = Array.prototype.filter.call(document.querySelectorAll('[data-apparition]'), function (el) {
    return !(hero && hero.contains(el));
  });
  gsap.set(autres, { opacity: 0, y: 22 });
  ST.batch(autres, {
    start: 'top 90%', once: true,
    onEnter: function (lot) { gsap.to(lot, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.09, overwrite: true }); }
  });

  /* ---- Cartes des prestations ---- */
  var cartes = document.querySelectorAll('[data-carte]');
  gsap.set(cartes, { opacity: 0, y: 40 });
  ST.batch(cartes, {
    start: 'top 90%', once: true,
    onEnter: function (lot) {
      gsap.to(lot, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12, overwrite: true,
        onComplete: function () { gsap.set(lot, { clearProps: 'transform' }); } });
    }
  });

  /* ---- Les ondes : elles se propagent quand on passe d'une section à l'autre ---- */
  if (ondes) {
    var etatOndes = { phase: 0, ampleur: 8, cible: 8 };
    var tourner = function () {
      etatOndes.phase += 0.012;
      etatOndes.ampleur += (etatOndes.cible - etatOndes.ampleur) * 0.06;
      dessinerOndes(etatOndes.phase, etatOndes.ampleur);
    };
    dessinerOndes(0, 8);
    ST.create({
      trigger: ondes, start: 'top bottom', end: 'bottom top',
      onToggle: function (s) { if (s.isActive) gsap.ticker.add(tourner); else gsap.ticker.remove(tourner); },
      onUpdate: function (s) { etatOndes.cible = 8 + Math.sin(s.progress * Math.PI) * 40; }
    });
  }

  /* ---- Les cercles de la zone d'intervention : le son qui se propage ---- */
  var cercles = document.querySelectorAll('[data-cercles] span');
  if (cercles.length) {
    var propagation = gsap.timeline({ repeat: -1, paused: true });
    cercles.forEach(function (c, i) {
      propagation.fromTo(c, { scale: 0.35, opacity: 0.55 }, { scale: 3.4, opacity: 0, duration: 7, ease: 'sine.out' }, i * 1.75);
    });
    ST.create({ trigger: cercles[0].closest('section'), start: 'top bottom', end: 'bottom top',
      onToggle: function (s) { if (s.isActive) propagation.play(); else propagation.pause(); } });
  }

  /* ---------- 4. Les trois introductions ---------- */
  var tlIntro = null;
  var finIntro = null;

  function jouerIntro(variante, auChargement) {
    if (!intro) { if (auChargement) lancerAccueil(); return; }
    if (reduit || !window.gsap) {
      if (!auChargement) afficherBulle('Les animations sont désactivées sur cet appareil.');
      return;
    }
    if (tlIntro) { tlIntro.kill(); tlIntro = null; }

    var q = function (s) { return intro.querySelectorAll(s); };
    var un = function (s) { return intro.querySelector(s); };
    var contenu = un('.intro__contenu'), mono = un('.intro__mono'), tranches = q('.intro__tranche');
    var signe = un('.intro__signature'), ligne = un('.intro__ligne');
    var cordeI = un('.intro__corde path'), haut = un('.intro__haut'), bas = un('.intro__bas');
    var clavier = q('.intro__clavier i'), plein = un('.intro__plein'), ronds = q('.intro__cercles span'), la = un('.intro__la');
    var tout = [contenu, mono, tranches, signe, ligne, cordeI, haut, bas, clavier, plein, ronds, la];

    gsap.killTweensOf(tout);
    gsap.set(tout, { clearProps: 'all' });
    intro.setAttribute('data-variante', variante);
    intro.hidden = false;
    html.classList.add('intro-active');
    html.classList.remove('intro-attendue');

    var termine = false;
    finIntro = function () {
      if (termine) return;
      termine = true;
      if (tlIntro) tlIntro.kill();
      tlIntro = null;
      intro.hidden = true;
      html.classList.remove('intro-active');
      gsap.set(tout, { clearProps: 'all' });
      try { sessionStorage.setItem('ap-intro-vue', '1'); } catch (e) {}
      if (auChargement) lancerAccueil();
      ST.refresh();
    };

    var tl = gsap.timeline({ onComplete: finIntro });
    tlIntro = tl;

    if (variante === 'corde') {
      /* 1 · La corde : une corde se tend, on la pince, le logo naît de sa vibration, le rideau s'ouvre */
      var etat = { amp: 0 };
      var vibrer = function (t) {
        var y = 40 + etat.amp * Math.sin(t * Math.PI * 2 * 6);
        cordeI.setAttribute('d', 'M0 40 Q500 ' + y.toFixed(2) + ' 1000 40');
      };
      cordeI.setAttribute('d', 'M0 40 L1000 40');
      gsap.set(mono, { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(signe, { clipPath: 'inset(0% 100% 0% 0%)' });
      gsap.set(ligne, { opacity: 0, y: 10 });
      tl.to(cordeI, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, 0.25)
        .fromTo(etat, { amp: 30 }, { amp: 0, duration: 1.6, ease: 'power2.out',
          onUpdate: function () { vibrer(this.time()); } }, 1.15)
        .to(mono, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.out' }, 1.2)
        .to(signe, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power2.inOut' }, 1.5)
        .to(ligne, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 2.2)
        .to([contenu, cordeI], { opacity: 0, duration: 0.4, ease: 'power1.in' }, 3.5)
        .to(haut, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 3.75)
        .to(bas, { yPercent: 100, duration: 1.1, ease: 'expo.inOut' }, 3.75);
      if (auChargement) tl.add(lancerAccueil, 4.15);
    }

    if (variante === 'touches') {
      /* 2 · Les touches : un glissando parcourt le clavier, le monogramme se joue comme un arpège, puis les touches se lèvent */
      gsap.set(clavier, { transformOrigin: '50% 0%' });
      gsap.set(tranches, { opacity: 0, y: -46 });
      gsap.set(signe, { opacity: 0, filter: 'blur(8px)' });
      gsap.set(ligne, { opacity: 0, y: 10 });
      tl.to(clavier, { y: 14, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1, stagger: 0.05 }, 0.2)
        .to(tranches, { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', stagger: 0.16 }, 1.05)
        .to(signe, { opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power2.out' }, 1.75)
        .to(ligne, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 2.3)
        .to(contenu, { opacity: 0, duration: 0.4, ease: 'power1.in' }, 3.5)
        .to(clavier, { scaleY: 0, duration: 0.7, ease: 'power3.inOut', stagger: { each: 0.05, from: 'end' } }, 3.7);
      if (auChargement) tl.add(lancerAccueil, 4.1);
    }

    if (variante === 'onde') {
      /* 3 · L'onde : le « la » du diapason, le son se propage, le logo se fait net, puis s'ouvre comme une onde */
      var rayon = Math.ceil(Math.hypot(window.innerWidth, window.innerHeight) / 2) + 40;
      gsap.set(plein, { '--trou': '0px' });
      gsap.set(la, { opacity: 0, letterSpacing: '0.6em' });
      gsap.set(ronds, { scale: 0.2, opacity: 0 });
      gsap.set(mono, { opacity: 0, scale: 1.08, filter: 'blur(14px)' });
      gsap.set(signe, { opacity: 0, filter: 'blur(10px)' });
      gsap.set(ligne, { opacity: 0, y: 10 });
      tl.to(la, { opacity: 1, letterSpacing: '0.4em', duration: 0.9, ease: 'power2.out' }, 0.2)
        .to(ronds, { keyframes: [{ opacity: 0.7, duration: 0.2 }, { scale: 3.4, opacity: 0, duration: 2.1, ease: 'sine.out' }], stagger: 0.32 }, 0.7)
        .to(la, { opacity: 0, duration: 0.45 }, 1.35)
        .to(mono, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power2.out' }, 1.5)
        .to(signe, { opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power2.out' }, 1.9)
        .to(ligne, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 2.35)
        .to(contenu, { opacity: 0, duration: 0.4, ease: 'power1.in' }, 3.6)
        .to(plein, { '--trou': rayon + 'px', duration: 1.25, ease: 'expo.inOut' }, 3.8);
      if (auChargement) tl.add(lancerAccueil, 4.25);
    }
  }
  window.jouerIntro = jouerIntro;

  var passer = intro && intro.querySelector('[data-passer]');
  if (passer) passer.addEventListener('click', function () { if (finIntro) finIntro(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && intro && !intro.hidden && finIntro) finIntro(); });

  // À l'arrivée sur l'accueil : l'introduction choisie (une fois par visite, ou si le lien la demande)
  if (html.classList.contains('intro-attendue')) jouerIntro(introChoisie(), true);
  else lancerAccueil();

  window.addEventListener('load', function () { ST.refresh(); });
})();
