/* Parallaxe légère sur les photos — translation uniquement, desktop uniquement */
import { addRaf, removeRaf, motionReduced } from '../core/motion.js';

const LIMIT = 34; /* débord interne des images (px) — voir CSS */

export default class Parallax {
  constructor(el) {
    this.els = [...el.querySelectorAll('[data-parallax]')];
    this.mq = window.matchMedia('(min-width: 900px)');
    this._tick = this._tick.bind(this);
  }

  init() {
    if (motionReduced || !this.els.length) return;
    addRaf(this._tick);
  }

  destroy() {
    removeRaf(this._tick);
    this.els.forEach(img => { img.style.translate = ''; });
  }

  _tick() {
    if (!this.mq.matches) return;
    /* lectures en batch */
    const shifts = this.els.map(img => {
      const rect = img.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return null;
      const centerOffset = rect.top + rect.height / 2 - innerHeight / 2;
      const factor = parseFloat(img.dataset.parallax) || 0.1;
      return Math.max(-LIMIT, Math.min(LIMIT, centerOffset * factor));
    });
    /* écritures en batch */
    this.els.forEach((img, i) => {
      if (shifts[i] === null) return;
      img.style.translate = `0 ${shifts[i]}px`;
    });
  }
}
