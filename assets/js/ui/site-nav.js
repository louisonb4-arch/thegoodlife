/* Navigation mobile — panneau plein écran vert bouteille */
export default class SiteNav {
  constructor(el) {
    this.el = el;
    this.toggle = el.querySelector('.site-nav__toggle');
    this.panel = el.querySelector('.site-nav__panel');
    this.links = [...el.querySelectorAll('.site-nav__link')];
    this._onToggle = this._onToggle.bind(this);
    this._onLink = this._onLink.bind(this);
    this._onKey = this._onKey.bind(this);
  }

  init() {
    this.toggle.addEventListener('click', this._onToggle);
    this.links.forEach(a => a.addEventListener('click', this._onLink));
    document.addEventListener('keydown', this._onKey);
  }

  destroy() {
    this.toggle.removeEventListener('click', this._onToggle);
    this.links.forEach(a => a.removeEventListener('click', this._onLink));
    document.removeEventListener('keydown', this._onKey);
  }

  _set(open) {
    this.el.classList.toggle('is-open', open);
    this.toggle.setAttribute('aria-expanded', open);
    document.documentElement.classList.toggle('nav-locked', open);
  }

  _onToggle() { this._set(!this.el.classList.contains('is-open')); }
  _onLink() { this._set(false); }
  _onKey(e) { if (e.key === 'Escape') this._set(false); }
}
