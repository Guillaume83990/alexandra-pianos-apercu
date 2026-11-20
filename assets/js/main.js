/* Alexandra Pianos · site (production, à partir de la maquette validée le 20/11/2026)
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
    palette: { petrol: 'a' },  // direction validée : A · Petrol Signature
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
      if (retour) retour.textContent = 'Formulaire en cours de branchement : à la mise en ligne, votre demande arrivera directement dans la boîte d’Alexandra.';
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

  /* Révélation photographique : un rideau qui se lève (écho de l'introduction « La corde »),
     la photo se pose en douceur, puis profondeur au défilement. Inspiré de « Mask Reveal » (21st.dev, balick). */
  // 20/11 (retour de Guillaume : « les images arrivent trop vite ») : rideau lent et doux.
  // Photo du haut : au chargement, en 2,6 s. Autres photos : le rideau suit le défilement (fluide, réversible).
  function revelerPhoto(figure, delai, auDefilement) {
    var img = figure.querySelector('img');
    if (auDefilement) {
      gsap.timeline({ scrollTrigger: { trigger: figure, start: 'top 95%', end: 'top 30%', scrub: 1.4 } })
        .fromTo(img, { opacity: 1, clipPath: 'inset(100% 0% 0% 0%)', scale: 1.3 },
          { clipPath: 'inset(0% 0% 0% 0%)', scale: 1.06, ease: 'power1.inOut' });
      // Profondeur : la photo glisse un peu moins vite que la page
      gsap.fromTo(img, { yPercent: 4 }, { yPercent: -4, ease: 'none',
        scrollTrigger: { trigger: figure, start: 'top bottom', end: 'bottom top', scrub: true } });
      return;
    }
    gsap.timeline({ delay: delai || 0 })
      .fromTo(img, { opacity: 1, clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.6, ease: 'power3.inOut' })
      .fromTo(img, { scale: 1.3 }, { scale: 1.06, duration: 3.6, ease: 'power2.out', clearProps: 'clipPath' }, 0);
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
    // Ses savoir-faire apparaissent l'un après l'autre, comme un arpège
    gsap.fromTo(hero.querySelectorAll('.savoir-faire > span'), { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.09, delay: 0.75 });
    accorder(2.3);
  }

  /* L'accordeur sur la photo du haut : les graduations s'allument depuis le centre,
     l'aiguille oscille de moins en moins, puis se pose sur « juste ». */
  var diapason = hero && hero.querySelector('[data-diapason]');
  if (diapason) {
    gsap.set(diapason, { opacity: 0 });
    gsap.set(diapason.querySelectorAll('.diapason__echelle i'), { scaleY: 0, transformOrigin: '50% 100%' });
    gsap.set(diapason.querySelector('.diapason__aiguille'), { left: '8%' });
    gsap.set(diapason.querySelector('.diapason__juste'), { opacity: 0, x: -6 });
  }
  function accorder(delai) {
    if (!diapason) return;
    var aiguille = diapason.querySelector('.diapason__aiguille');
    gsap.timeline({ delay: delai })
      .to(diapason, { opacity: 1, duration: 0.9, ease: 'power2.out' })
      .to(diapason.querySelectorAll('.diapason__echelle i'), { scaleY: 1, duration: 0.6, ease: 'power2.out',
        stagger: { each: 0.035, from: 'center' } }, 0.2)
      .to(aiguille, { left: '80%', duration: 0.75, ease: 'sine.inOut' }, 0.5)
      .to(aiguille, { left: '30%', duration: 0.6, ease: 'sine.inOut' })
      .to(aiguille, { left: '64%', duration: 0.5, ease: 'sine.inOut' })
      .to(aiguille, { left: '44%', duration: 0.45, ease: 'sine.inOut' })
      .to(aiguille, { left: '53%', duration: 0.4, ease: 'sine.inOut' })
      .to(aiguille, { left: '50%', duration: 0.5, ease: 'power2.out' })
      .add(function () { diapason.classList.add('est-juste'); })
      .to(diapason.querySelector('.diapason__juste'), { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }, '-=0.1');
  }
  if (hero) gsap.set(hero.querySelectorAll('.savoir-faire > span'), { opacity: 0 });
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
    revelerPhoto(photo, 0, true);
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

  /* ---- Texte « Bienvenue » : il s'éclaire mot à mot pendant la lecture.
          Inspiré de « Text Reveal » au défilement (21st.dev, ddoemonn / wensity) ---- */
  document.querySelectorAll('[data-mots]').forEach(function (p) {
    var mots = p.textContent.trim().split(/\s+/);
    p.textContent = '';
    mots.forEach(function (m, i) {
      var s = document.createElement('span');
      s.className = 'mot';
      s.textContent = m;
      p.appendChild(s);
      if (i < mots.length - 1) p.appendChild(document.createTextNode(' '));
    });
    gsap.fromTo(p.querySelectorAll('.mot'), { opacity: 0.16 }, { opacity: 1, ease: 'none', stagger: 0.05,
      scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 52%', scrub: 0.6 } });
  });

  /* ---- Les chiffres des conseils montent jusqu'à leur valeur. Inspiré de « Count Up » (21st.dev, unlumen) ---- */
  document.querySelectorAll('[data-compte]').forEach(function (el) {
    var cible = parseInt(el.textContent, 10);
    if (isNaN(cible)) return;
    var etat = { v: 0 };
    el.textContent = '0';
    ST.create({ trigger: el, start: 'top 88%', once: true, onEnter: function () {
      gsap.to(etat, { v: cible, duration: 1.9, ease: 'power3.out', delay: 0.15,
        onUpdate: function () { el.textContent = Math.round(etat.v); } });
    } });
  });

  /* ---- Bandeau des savoir-faire : il défile lentement, s'accélère un peu avec le défilement de la page.
          Inspiré de « Infinite Marquee » (21st.dev, wensity) ---- */
  var defile = document.querySelector('[data-defile]');
  if (defile) {
    var piste = defile.querySelector('.defile__piste');
    var boucle = gsap.to(piste, { xPercent: -50, duration: 48, ease: 'none', repeat: -1, paused: true });
    ST.create({ trigger: defile, start: 'top bottom', end: 'bottom top',
      onToggle: function (s) { if (s.isActive) boucle.play(); else boucle.pause(); },
      onUpdate: function (s) {
        var elan = Math.min(Math.abs(s.getVelocity()) / 400, 4);
        gsap.to(boucle, { timeScale: 1 + elan, duration: 0.25, overwrite: true,
          onComplete: function () { gsap.to(boucle, { timeScale: 1, duration: 1.2, ease: 'power2.out' }); } });
      } });
  }

  /* ---- Prestations « en partition » : les cordes se tendent l'une après l'autre, les noms montent,
          chaque corde vibre au survol, et la photo de la prestation s'affiche dans sa propre colonne ---- */
  var portee = document.querySelector('[data-portee]');
  if (portee) {
    var cordesPortee = Array.prototype.map.call(portee.querySelectorAll('[data-corde-portee]'), creerCorde);
    var lignes = portee.querySelectorAll('.portee__ligne');
    gsap.set(portee.querySelectorAll('.portee__nom span'), { yPercent: 110 });
    gsap.set(portee.querySelectorAll('.portee__num, .portee__texte, .portee__note, .portee__fleche'), { opacity: 0, y: 14 });
    ST.create({ trigger: portee, start: 'top 82%', once: true, onEnter: function () {
      cordesPortee.forEach(function (c, i) { tendreCorde(c, i * 0.22); });
      lignes.forEach(function (l, i) {
        var d = 0.25 + i * 0.22;
        gsap.to(l.querySelector('.portee__nom span'), { yPercent: 0, duration: 1.3, ease: 'expo.out', delay: d });
        gsap.to(l.querySelectorAll('.portee__num, .portee__texte, .portee__note, .portee__fleche'),
          { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08, delay: d + 0.15 });
      });
    } });

    // 2e version (retour de Guillaume : jamais d'image sur le texte) : la photo vit dans sa propre colonne,
    // fixe pendant le défilement. Elle change en fondu selon la prestation survolée, ou celle qui passe
    // au centre de l'écran. Inspiré de « Scroll Reveal Content » (21st.dev, abui), sélection du 30/10.
    lignes.forEach(function (l, i) {
      l.addEventListener('mouseenter', function () { if (cordesPortee[i + 1] && cordesPortee[i + 1].tendue) cordesPortee[i + 1].pincer(6); });
    });
    var cadre = portee.querySelector('[data-cadre]');
    if (cadre) {
      var images = {};
      cadre.querySelectorAll('[data-cadre-img]').forEach(function (i) { images[i.getAttribute('data-cadre-img')] = i; });
      var legende = [portee.querySelector('[data-cadre-num]'), portee.querySelector('[data-cadre-nom]')];
      var courante = 0;
      lignes[0].classList.add('est-active');
      // Le cadre se dévoile comme les autres photos : un rideau lié au défilement
      gsap.fromTo(cadre, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power1.inOut',
        scrollTrigger: { trigger: cadre, start: 'top 95%', end: 'top 45%', scrub: 1.4 } });
      var montrer = function (i) {
        if (i === courante) return;
        courante = i;
        var l = lignes[i], cle = l.getAttribute('data-apercu');
        Object.keys(images).forEach(function (k) {
          gsap.to(images[k], { opacity: k === cle ? 1 : 0, scale: k === cle ? 1 : 1.08, duration: 1.1, ease: 'power2.inOut', overwrite: true });
        });
        lignes.forEach(function (x, j) { x.classList.toggle('est-active', j === i); });
        gsap.timeline()
          .to(legende, { yPercent: -100, opacity: 0, duration: 0.3, ease: 'power2.in', overwrite: true })
          .add(function () {
            legende[0].textContent = l.querySelector('.portee__num').textContent;
            legende[1].textContent = l.querySelector('.portee__nom').textContent.trim();
          })
          .fromTo(legende, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, ease: 'power3.out' });
      };
      lignes.forEach(function (l, i) {
        l.addEventListener('mouseenter', function () { montrer(i); });
        l.addEventListener('focus', function () { montrer(i); });
        ST.create({ trigger: l, start: 'top 55%', end: 'bottom 55%', onToggle: function (s) { if (s.isActive) montrer(i); } });
      });
    }
  }

  /* ---- Respirations plein écran : l'image se dévoile lentement et recule doucement pendant le défilement ---- */
  document.querySelectorAll('[data-interlude-image]').forEach(function (bloc) {
    var img = bloc.querySelector('img');
    gsap.fromTo(img, { scale: 1.18, yPercent: -5 }, { scale: 1.02, yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: bloc.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo(bloc, { clipPath: 'inset(12% 8% 12% 8%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power1.inOut',
      scrollTrigger: { trigger: bloc.parentElement, start: 'top 90%', end: 'top 20%', scrub: 1.4 } });
  });

  /* ---- Les communes s'allument l'une après l'autre, comme des touches jouées ---- */
  var listeCommunes = document.querySelector('.communes');
  if (listeCommunes) {
    var accent = getComputedStyle(html).getPropertyValue('--accent').trim() || '#B89B70';
    ST.create({ trigger: listeCommunes, start: 'top 75%', once: true, onEnter: function () {
      gsap.to(listeCommunes.querySelectorAll('li'), { color: accent, duration: 0.35, ease: 'power1.out',
        stagger: { each: 0.11, yoyo: true, repeat: 1 }, delay: 0.6, clearProps: 'color' });
    } });
  }

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
      // 20/11 : le son s'apaise jusqu'au silence, juste avant la section « Jouer en silence »
      onUpdate: function (s) { etatOndes.cible = 0.6 + 46 * Math.pow(1 - s.progress, 1.6); }
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
