/* =========================================================================
   THE GOOD LIFE — motion runtime (vanilla, zéro dépendance)
   ========================================================================= */

export const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const inViewport = (el) => {
  const r = el.getBoundingClientRect();
  return r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0;
};

/* Attribue un --module-delay croissant aux seuls blocs visibles au chargement. */
export const moduleDelays = (increment = 350, base = 550, target = document.body) => {
  const els = [...target.querySelectorAll('[data-module-delay]')];
  const visibility = els.map(inViewport); // lecture en batch
  let delay = base;
  els.forEach((el, i) => {                // écriture en batch
    const visible = visibility[i];
    el.setAttribute('data-module-delay', visible);
    if (!visible) return;
    el.style.setProperty('--module-delay', `${delay}ms`);
    delay += el.dataset.moduleDelayIncrement
      ? parseInt(el.dataset.moduleDelayIncrement, 10)
      : increment;
  });
};

export const setSelfDelays = (container, step = 90) => {
  [...container.querySelectorAll('[data-reveal]')].forEach((el, i) => {
    el.style.setProperty('--self-delay', `${i * step}ms`);
  });
};

/* Masque par mot, sans dépendance */
export const splitWords = (el) => {
  if (el.dataset.splitDone) return;
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  const words = text.split(' ');
  el.setAttribute('aria-label', text);
  el.innerHTML = words.map((word, i) =>
    `<span class="word" aria-hidden="true" style="--word-index:${i}">` +
    `<span class="word__inner">${word}</span></span>`
  ).join(' ');
  el.style.setProperty('--word-total', words.length);
  el.dataset.splitDone = 'true';
};

/* Observer unique.
   [data-reveal-group] : le parent est observé à la place de ses enfants
   (obligatoire pour les clip-path masquant 100% — l'IO ne fire jamais dessus). */
let observer = null;

const fire = (el) => {
  el.classList.add('is-inview');
  el.querySelectorAll('[data-reveal], [data-split]').forEach(c => c.classList.add('is-inview'));
};

export const observe = (root = document) => {
  if (motionReduced) return;

  observer ||= new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      fire(entry.target);
      observer.unobserve(entry.target); // one-shot
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });

  root.querySelectorAll('[data-reveal], [data-split], [data-reveal-group]').forEach(el => {
    if (el.closest('[data-reveal-group]') && !el.hasAttribute('data-reveal-group')) return;
    observer.observe(el);
  });
};

/* Séquence d'ouverture.
   minTime : temps d'affichage minimal du loader (le lettrage de la vitrine
   doit finir de se composer avant la cascade). */
export const boot = ({ base = 550, step = 350, loader = '[data-site-loader]', minTime = 0 } = {}) => {
  document.querySelectorAll('[data-split]').forEach(splitWords);
  const t0 = performance.now();

  const onReady = () => {
    const run = () => {
      moduleDelays(step, base);
      if (!motionReduced) document.documentElement.classList.add('--js-inview-enabled');

      document.querySelectorAll(
        '[data-module-delay="true"][data-reveal],' +
        '[data-module-delay="true"] [data-reveal],' +
        '[data-module-delay="true"] [data-split]'
      ).forEach(el => el.classList.add('is-inview'));

      observe();

      const el = document.querySelector(loader);
      if (!el) return;
      el.classList.add('--js-ready');
      el.addEventListener('transitionend', () => el.remove(), { once: true });
    };

    const remaining = motionReduced ? 0 : Math.max(0, minTime - (performance.now() - t0));
    remaining > 0 ? setTimeout(run, remaining) : run();
  };

  if (document.readyState === 'complete') onReady();
  else window.addEventListener('load', onReady, { once: true });
};

/* RAF global — un seul pour tout le site, pas un par module */
const tasks = new Set();
let running = false;

const tick = () => {
  tasks.forEach(fn => fn());
  running = tasks.size > 0;
  if (running) requestAnimationFrame(tick);
};

export const addRaf = (fn) => {
  tasks.add(fn);
  if (!running) { running = true; requestAnimationFrame(tick); }
};
export const removeRaf = (fn) => tasks.delete(fn);

/* Chargement des modules déclarés dans le HTML */
export const loadModules = async (root = document) => {
  const jobs = [];
  root.querySelectorAll('[data-module],[data-ui]').forEach(el => {
    const isUI = !!el.dataset.ui;
    const dir  = isUI ? 'ui' : 'modules';
    (isUI ? el.dataset.ui : el.dataset.module).split(',').forEach(name => {
      jobs.push(
        import(`../${dir}/${name.trim()}.js`)
          .then(({ default: Mod }) => new Mod(el).init())
          .catch(err => console.warn(`[motion] module "${name.trim()}" absent`, err))
      );
    });
  });
  await Promise.all(jobs);
};
