// Winkel: één overzicht met uitklapbare categorieën (data/shop.js). Kopen, activeren, plaatsen.
import { SHOP_CATEGORIES } from './data/shop.js';
import { SHOP_TOOLS } from './data/tools.js';
import { BUCKETS } from './data/buckets.js';
import { COSMETIC_LISTS, DECORATIONS } from './data/cosmetics.js';
import { PACKAGES } from './data/packages.js';
import { T } from './data/texts.js';
import { icon } from './ui/icons.js';
import { purchaseService } from './purchases.js';

const OPEN_KEY = 'flushfactor_shop_open';
const fmt = n => n.toLocaleString('nl-NL');

export class Shop {
  // actions: { activateCosmetic(slot, id), toggleDecor(def), setBucket(id), addTool(id), changed() }
  constructor(state, actions) {
    this.state = state;
    this.actions = actions;
    this.screen = document.getElementById('shop-screen');
    this.list = document.getElementById('shop-items');
    this.msg = document.getElementById('shop-message');
    this.open_ = this._loadOpen();
  }

  _loadOpen() {
    try { return new Set(JSON.parse(localStorage.getItem(OPEN_KEY) || '[]')); } catch { return new Set(); }
  }
  _saveOpen() {
    try { localStorage.setItem(OPEN_KEY, JSON.stringify([...this.open_])); } catch { /* geen opslag */ }
  }

  open() {
    this.render();
    this.screen.hidden = false;
    document.body.dataset.screen = 'shop';
  }
  close() {
    this.screen.hidden = true;
    delete document.body.dataset.screen;
  }

  // Per bron: de lijst en hoe een item zich gedraagt.
  _source(cat) {
    const s = this.state;
    const owned = item => item.price === 0 || s.purchased.has(item.id);
    switch (cat.source) {
      case 'tools': return {
        items: SHOP_TOOLS,
        owned: i => s.ownedTools.includes(i.id),
        locked: i => (i.minLevel || 1) > s.level,
        onBuy: i => { this.actions.addTool(i.id); return T.shop.toolAdded(i.name); },
      };
      case 'cosmetic': return {
        items: COSMETIC_LISTS[cat.slot], owned,
        active: i => s.cosmetics[cat.slot] === i.id,
        onUse: i => this.actions.activateCosmetic(cat.slot, i.id),
      };
      case 'decoration': return {
        items: DECORATIONS, owned,
        active: i => s.decor[i.anchor] === i.id, activeLabel: T.shop.placed,
        onUse: i => { const placed = this.actions.toggleDecor(i); return placed ? T.shop.decoPlaced(i.name) : T.shop.decoRemoved(i.name); },
        toggles: true,
      };
      case 'buckets': return {
        items: BUCKETS, owned,
        active: i => s.bucketId === i.id,
        onUse: i => this.actions.setBucket(i.id),
        detail: i => `${i.liters} liter`,
      };
      default: return { items: [] };
    }
  }

  render() {
    this.list.textContent = '';
    for (const cat of SHOP_CATEGORIES) this.list.appendChild(this._category(cat));
  }

  _category(cat) {
    const isOpen = this.open_.has(cat.id);
    const src = this._source(cat);
    const wrap = document.createElement('section');
    wrap.className = 'shop-category';
    wrap.dataset.cat = cat.id;

    const count = cat.source === 'packages' ? '' : `<span class="shop-category-count">${src.items.filter(src.owned).length}/${src.items.length}</span>`;
    const head = document.createElement('button');
    head.className = 'shop-category-header';
    head.setAttribute('aria-expanded', String(isOpen));
    head.innerHTML = `${icon(cat.icon, 22)}<span class="shop-category-label">${cat.label}</span>${count}${icon('chevron-down', 18, 'shop-category-arrow')}`;

    const body = document.createElement('div');
    body.className = 'shop-category-body';
    body.classList.toggle('open', isOpen);
    const grid = document.createElement('div');
    grid.className = 'shop-grid';
    if (cat.source === 'packages') PACKAGES.forEach(p => grid.appendChild(this._packageCard(p)));
    else src.items.forEach(item => grid.appendChild(this._card(item, src)));
    body.appendChild(grid);

    head.addEventListener('click', () => {
      const open = !this.open_.has(cat.id);
      open ? this.open_.add(cat.id) : this.open_.delete(cat.id);
      head.setAttribute('aria-expanded', String(open));
      body.classList.toggle('open', open);
      this._saveOpen();
    });

    wrap.append(head, body);
    return wrap;
  }

  _packageCard(pkg) {
    const card = document.createElement('button');
    card.className = 'shop-card buy-card';
    card.dataset.id = pkg.id;
    card.innerHTML = `
      <span class="shop-card-icon">${icon('coins', 34)}</span>
      <span class="shop-card-name">${pkg.label}</span>
      <span class="shop-card-price"><span class="price-tag buy-price">${pkg.price}</span>${pkg.badge ? `<span class="badge badge-popular">${pkg.badge}</span>` : ''}</span>`;
    card.addEventListener('click', async () => {
      await purchaseService.buy(pkg.id);
      this.say(T.shop.purchaseSoon);
    });
    return card;
  }

  _card(item, src) {
    const s = this.state;
    const locked = src.locked?.(item) || false;
    const owned = !locked && src.owned(item);
    const active = owned && (src.active?.(item) || false);
    const affordable = s.score >= item.price;

    const card = document.createElement('button');
    card.className = ['shop-card', locked && 'locked', owned && 'owned', active && 'active', !locked && !owned && !affordable && 'expensive'].filter(Boolean).join(' ');
    card.dataset.id = item.id;
    card.disabled = locked;

    let status;
    if (locked) status = `<span class="badge badge-locked">${icon('lock', 12)} ${T.shop.lockedLevel(item.minLevel)}</span>`;
    else if (active) status = `<span class="badge badge-active">${src.activeLabel || T.shop.active}</span>`;
    else if (owned) status = `<span class="badge badge-owned">${T.shop.owned}</span>`;
    else status = `<span class="price-tag">${icon('coins', 13)} ${fmt(item.price)}</span>`;

    card.innerHTML = `
      <span class="shop-card-icon">${icon(item.icon, 34)}</span>
      <span class="shop-card-name">${item.name}</span>
      ${src.detail ? `<span class="shop-card-detail">${src.detail(item)}</span>` : ''}
      <span class="shop-card-desc">${item.description || ''}</span>
      <span class="shop-card-price">${status}</span>`;

    if (!locked) card.addEventListener('click', () => this._click(item, src, owned, active));
    return card;
  }

  _click(item, src, owned, active) {
    const s = this.state;
    let message = null;
    if (owned) {
      if (active && !src.toggles) return;
      if (!src.onUse) return;
      message = src.onUse(item);
    } else {
      if (s.score < item.price) return this.say(T.shop.notEnough(fmt(item.price)));
      s.score -= item.price;
      s.purchased.add(item.id);
      message = src.onBuy ? src.onBuy(item) : (src.onUse?.(item), T.shop.bought(item.name));
      if (typeof message !== 'string') message = T.shop.bought(item.name);
    }
    this.actions.changed();
    this.render();
    if (typeof message === 'string') this.say(message);
  }

  say(text) {
    this.msg.textContent = text;
    this.msg.classList.remove('visible');
    void this.msg.offsetWidth;          // herstart de animatie, ook bij dezelfde tekst
    this.msg.classList.add('visible');
    clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => this.msg.classList.remove('visible'), 2400);
  }
}
