/* Rayons — rail horizontal scrubbé au scroll, section épinglée (desktop) */
import { addRaf, removeRaf, motionReduced } from '../core/motion.js';

export default class Rayons {
  constructor(el) {
    this.el = el;
    this.track = el.querySelector('.rayons__track');
    this.mq = window.matchMedia('(min-width: 900px)');
    this.current = 0;
    this.max = 0;
    this._tick = this._tick.bind(this);
    this._measure = this._measure.bind(this);
  }

  init() {
    if (motionReduced || !this.track) return;
    this._measure();
    this.mq.addEventListener('change', this._measure);
    addEventListener('resize', this._measure, { passive: true });
    addRaf(this._tick);
  }

  destroy() {
    this.mq.removeEventListener('change', this._measure);
    removeEventListener('resize', this._measure);
    removeRaf(this._tick);
  }

  _measure() {
    if (!this.mq.matches) {
      this.track.style.translate = '';
      this.max = 0;
      return;
    }
    this.max = Math.max(0, this.track.scrollWidth - innerWidth);
  }

  _tick() {
    if (!this.mq.matches || !this.max) return;
    const rect = this.el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;

    const total = rect.height - innerHeight;
    const progress = Math.min(1, Math.max(0, -rect.top / total));
    const target = -progress * this.max;

    /* lissage léger — le rail “suit” le scroll */
    this.current += (target - this.current) * 0.14;
    if (Math.abs(target - this.current) < .5) this.current = target;
    this.track.style.translate = `${this.current}px 0`;
  }
}
