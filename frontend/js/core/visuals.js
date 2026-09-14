/**
 * Visual assets, empty states, scroll animations — no business logic.
 */
const Visuals = {
  /** Picsum — reliable fallback when Unsplash is blocked or slow */
  picsum(id, w, h) {
    return `https://picsum.photos/id/${id}/${w}/${h}`;
  },

  FALLBACK: 'https://picsum.photos/id/1036/800/500',

  IMAGES: {
    hero: 'https://images.unsplash.com/photo-1436491865339-9a61bfe4060a?auto=format&fit=crop&w=1920&q=75',
    heroFallback: 'https://picsum.photos/id/1036/1920/1080',
    auth: 'https://picsum.photos/id/1036/1200/800',
    banner: 'https://picsum.photos/id/1067/1600/400',
    empty: 'https://picsum.photos/id/1050/600/400',
    loading: 'https://picsum.photos/id/1036/400/260',
    /** Stable Picsum IDs — load consistently worldwide */
    destinations: [
      'https://picsum.photos/id/1036/600/200',
      'https://picsum.photos/id/1008/600/200',
      'https://picsum.photos/id/1015/600/200',
      'https://picsum.photos/id/1043/600/200',
      'https://picsum.photos/id/1050/600/200',
      'https://picsum.photos/id/1067/600/200'
    ]
  },

  _observer: null,

  onImgError(img) {
    if (!img) return;
    const step = parseInt(img.dataset.fallbackStep || '0', 10);
    const chain = [img.dataset.fallback, Visuals.FALLBACK].filter(Boolean);

    if (step < chain.length) {
      img.dataset.fallbackStep = String(step + 1);
      const next = chain[step];
      if (img.src !== next) img.src = next;
      return;
    }

    img.classList.add('img-broken', 'img-fallback');
  },

  onImgLoad(img) {
    if (!img) return;
    img.classList.remove('img-broken');
    img.classList.add('is-loaded');
  },

  imgTag(src, alt = '', extraClass = '', opts = {}) {
    const fb = opts.fallback || Visuals.FALLBACK;
    const loading = opts.eager ? 'eager' : 'lazy';
    const cls = ['visual-img', extraClass].filter(Boolean).join(' ');
    const w = opts.width ? ` width="${opts.width}"` : '';
    const h = opts.height ? ` height="${opts.height}"` : '';
    const safeAlt = String(alt).replace(/"/g, '');
    const safeSrc = String(src).replace(/"/g, '');
    const safeFb = String(fb).replace(/"/g, '');
    return `<img src="${safeSrc}" data-fallback="${safeFb}" data-fallback-step="0" alt="${safeAlt}" class="${cls}" loading="${loading}" decoding="async"${w}${h}>`;
  },

  bindImages(root = document) {
    const nodes = root.querySelectorAll ? root.querySelectorAll('img') : document.querySelectorAll('img');
    nodes.forEach((img) => {
      if (!img.dataset.fallback) img.dataset.fallback = Visuals.FALLBACK;
      if (!img.dataset.fallbackStep) img.dataset.fallbackStep = '0';

      if (!img.dataset.imgBound) {
        img.dataset.imgBound = '1';
        img.addEventListener('load', () => Visuals.onImgLoad(img));
        img.addEventListener('error', () => Visuals.onImgError(img));
      }

      if (img.complete) {
        if (img.naturalWidth > 0) Visuals.onImgLoad(img);
        else Visuals.onImgError(img);
      }
    });
  },

  hashIndex(str, max) {
    let h = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * (i + 1)) % max;
    return h;
  },

  getFlightImage(flight, index = 0) {
    const key = flight?.destination || flight?.source || index;
    const i =
      (index + Visuals.hashIndex(key, Visuals.IMAGES.destinations.length)) %
      Visuals.IMAGES.destinations.length;
    return Visuals.IMAGES.destinations[i];
  },

  mediaBackgroundStyle(url) {
    const safe = String(url || Visuals.FALLBACK).replace(/'/g, '%27');
    const fb = Visuals.FALLBACK.replace(/'/g, '%27');
    return `background-image:url('${safe}'),url('${fb}')`;
  },

  renderEmptyState({ title, message, actionHtml = '' } = {}) {
    return `<div class="empty-state reveal is-visible">
      ${Visuals.imgTag(Visuals.IMAGES.empty, 'No results', 'empty-state-img', { width: 280, height: 180, fallback: Visuals.FALLBACK })}
      <h3>${UI.escapeHtml(title || 'No results')}</h3>
      <p>${UI.escapeHtml(message || 'Try adjusting your search.')}</p>
      ${actionHtml ? `<div class="empty-state-actions">${actionHtml}</div>` : ''}
    </div>`;
  },

  renderLoadingState(message = 'Loading flights') {
    return `<div class="loading-state">
      <div class="loading-plane">${Icons.planeLarge()}</div>
      ${Visuals.imgTag(Visuals.IMAGES.loading, '', 'loading-state-bg', { width: 120, height: 80, fallback: Visuals.FALLBACK })}
      <p>${UI.escapeHtml(message)}</p>
      <div class="loading-dots"><span></span><span></span><span></span></div>
    </div>`;
  },

  injectHeroPlane() {
    const hero = document.querySelector('.hero');
    if (!hero || hero.querySelector('.hero-plane')) return;
    const plane = document.createElement('div');
    plane.className = 'hero-plane';
    plane.setAttribute('aria-hidden', 'true');
    plane.innerHTML = Icons.planeLarge();
    hero.appendChild(plane);
  },

  injectHeroBackground() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    let img = hero.querySelector('.hero-bg');
    if (!img) return;
    img.dataset.fallback = Visuals.IMAGES.heroFallback;
    img.dataset.fallbackStep = '0';
    Visuals.bindImages(hero);
  },

  initScrollReveal() {
    if (Visuals._observer) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }

    Visuals._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            Visuals._observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -24px 0px', threshold: 0.05 }
    );

    Visuals.refreshReveal();
  },

  refreshReveal() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
      if (prefersReduced) {
        el.classList.add('is-visible');
        return;
      }
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
      if (inView) el.classList.add('is-visible');
      else if (Visuals._observer) Visuals._observer.observe(el);
    });
    if (!Visuals._observer && !prefersReduced) Visuals.initScrollReveal();
  },

  upgradeInputIcons() {
    document.querySelectorAll('.input-wrap').forEach((wrap) => {
      const iconEl = wrap.querySelector('.input-icon');
      if (!iconEl || iconEl.querySelector('svg')) return;
      const label = wrap.closest('.form-group')?.querySelector('label')?.textContent?.toLowerCase() || '';
      const id = wrap.querySelector('input, select')?.id || '';
      let svg = Icons.mapPin(18);
      if (label.includes('date') || id.includes('date')) svg = Icons.calendar(18);
      else if (label.includes('email') || id.includes('email')) svg = Icons.mail(18);
      else if (label.includes('password') || id.includes('password')) svg = Icons.lock(18);
      else if (label.includes('name') || id.includes('name')) svg = Icons.user(18);
      else if (label.includes('card') || id.includes('card')) svg = Icons.creditCard(18);
      else if (label.includes('flight') || id.includes('flight')) svg = Icons.plane(18);
      iconEl.innerHTML = svg;
      iconEl.classList.add('input-icon-svg');
    });
  },

  injectAuthBackground() {
    document.querySelectorAll('.auth-hero').forEach((hero) => {
      if (hero.querySelector('.auth-hero-bg')) return;
      const img = document.createElement('img');
      img.className = 'auth-hero-bg visual-img';
      img.src = Visuals.IMAGES.auth;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.dataset.fallback = Visuals.FALLBACK;
      img.dataset.fallbackStep = '0';
      hero.insertBefore(img, hero.firstChild);
      Visuals.bindImages(hero);
    });
  },

  injectPageBanner() {
    document.querySelectorAll('.page-banner[data-banner-auto]').forEach((banner) => {
      if (banner.querySelector('.page-banner-img')) return;
      const img = document.createElement('img');
      img.className = 'page-banner-img visual-img';
      img.src = banner.dataset.bannerSrc || Visuals.IMAGES.banner;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.dataset.fallback = Visuals.FALLBACK;
      img.dataset.fallbackStep = '0';
      banner.insertBefore(img, banner.firstChild);
      Visuals.bindImages(banner);
    });
  },

  afterContentUpdate(root) {
    const scope = root && root.querySelectorAll ? root : document;
    Visuals.bindImages(scope);
    Visuals.refreshReveal();
  },

  init() {
    Visuals.injectHeroBackground();
    Visuals.injectHeroPlane();
    Visuals.injectAuthBackground();
    Visuals.injectPageBanner();
    Visuals.upgradeInputIcons();
    Visuals.bindImages(document);
    Visuals.initScrollReveal();
  }
};

document.addEventListener('DOMContentLoaded', () => Visuals.init());

window.Visuals = Visuals;
