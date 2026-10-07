// ============================================================
// THE FLUSH FACTOR — shop.js
// Winkellogica: accordion-layout, kopen, cosmetica toepassen.
// ============================================================

import { COSMETICS, PREMIUM_TOOLS, BASKET_CONFIG } from './items.js';
import { icon } from './icons.js';
import { PACKAGES, purchaseService } from './purchases.js';

// ──────── CATEGORIE-DEFINITIES ────────
const CATEGORIES = [
  { id: 'buy',        label: 'Punten kopen',   icon: 'coins',         type: 'buy' },
  { id: 'tools',      label: 'Gereedschap',    icon: 'wrench',        type: 'tools' },
  { id: 'toilets',    label: 'Toiletmodellen', icon: 'toilet',        type: 'cosmetics', cat: 'toilet' },
  { id: 'tiles',      label: 'Tegelpatronen',  icon: 'grid-2x2',      type: 'cosmetics', cat: 'tiles' },
  { id: 'floors',     label: 'Vloeren',        icon: 'layers',        type: 'cosmetics', cat: 'floor' },
  { id: 'decoration', label: 'Decoratie',      icon: 'sparkles',      type: 'cosmetics', cat: 'decoration' },
  { id: 'baskets',    label: 'Manden',         icon: 'wicker-basket', type: 'baskets' },
];

const OPEN_KEY = 'flushfactor_shop_open';

export class ShopSystem {
  constructor(gameState, inventorySystem) {
    this.state = gameState;
    this.inv = inventorySystem;
    this._onPurchase = null;   // callback(item, type)
  }

  onPurchase(fn) { this._onPurchase = fn; }

  open() {
    const screen = document.getElementById('shop-screen');
    const game   = document.getElementById('game-screen');
    if (!screen || !game) return;
    this.render();
    game.hidden = true;
    screen.hidden = false;
    screen.classList.add('screen-enter');
    setTimeout(() => screen.classList.remove('screen-enter'), 300);
  }

  close() {
    const screen = document.getElementById('shop-screen');
    const game   = document.getElementById('game-screen');
    if (!screen || !game) return;
    screen.hidden = true;
    game.hidden = false;
  }

  render() {
    const container = document.getElementById('shop-items');
    if (!container) return;
    container.innerHTML = '';

    const accordion = document.createElement('div');
    accordion.className = 'shop-accordion';

    // Laad persistente open-staat
    let openIds;
    try { openIds = new Set(JSON.parse(localStorage.getItem(OPEN_KEY) || '[]')); }
    catch { openIds = new Set(); }

    CATEGORIES.forEach(cat => {
      const section = this._buildCategory(cat, openIds.has(cat.id));
      accordion.appendChild(section);
    });

    container.appendChild(accordion);

    // Luister naar purchase:pending voor 'binnenkort beschikbaar'-melding
    document.addEventListener('purchase:pending', this._handlePurchasePending.bind(this), { once: true });
  }

  _handlePurchasePending() {
    this._showShopMsg('Binnenkort beschikbaar');
  }

  _buildCategory(cat, startOpen) {
    const wrapper = document.createElement('div');
    wrapper.className = 'shop-category';

    // Teller berekenen
    const { owned, total } = this._countCategory(cat);
    const countLabel = total > 0 ? `<span class="shop-category-count">${owned}/${total}</span>` : '';

    const btn = document.createElement('button');
    btn.className = 'shop-category-header';
    btn.setAttribute('aria-expanded', startOpen ? 'true' : 'false');
    btn.innerHTML = `
      <span class="icon-wrap">${icon(cat.icon, 22)}</span>
      <span class="shop-category-label">${cat.label}</span>
      ${countLabel}
      <span class="shop-category-arrow icon-wrap">${icon('chevron-down', 18)}</span>
    `;

    const body = document.createElement('div');
    body.className = 'shop-category-body' + (startOpen ? ' open' : '');

    const inner = document.createElement('div');
    inner.className = 'shop-category-body-inner';

    if (cat.type === 'buy') {
      inner.appendChild(this._buildBuySection());
    } else if (cat.type === 'tools') {
      inner.appendChild(this._buildGrid(PREMIUM_TOOLS, 'tool'));
    } else if (cat.type === 'baskets') {
      inner.appendChild(this._buildGrid(BASKET_CONFIG, 'basket'));
    } else if (cat.type === 'cosmetics') {
      const items = COSMETICS.filter(c => c.category === cat.cat);
      inner.appendChild(this._buildGrid(items, 'cosmetic'));
    }

    body.appendChild(inner);
    wrapper.appendChild(btn);
    wrapper.appendChild(body);

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      body.classList.toggle('open', !isOpen);
      this._persistOpenState();
    });

    return wrapper;
  }

  _countCategory(cat) {
    let items = [];
    if (cat.type === 'tools')      items = PREMIUM_TOOLS;
    else if (cat.type === 'baskets')  items = BASKET_CONFIG;
    else if (cat.type === 'cosmetics') items = COSMETICS.filter(c => c.category === cat.cat);
    else return { owned: 0, total: 0 };

    const total = items.length;
    const owned = items.filter(item => {
      if (item.price === 0) return true;
      if (item.capacity !== undefined) return item.id === (this.state.activeBasket || 'basket-s');
      return this.state.purchasedItems.has(item.id);
    }).length;
    return { owned, total };
  }

  _persistOpenState() {
    const openIds = [...document.querySelectorAll('.shop-category-header[aria-expanded="true"]')]
      .map(btn => btn.closest('.shop-category')?.dataset.catId)
      .filter(Boolean);
    try { localStorage.setItem(OPEN_KEY, JSON.stringify(openIds)); } catch {}
  }

  _buildBuySection() {
    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    PACKAGES.forEach(pkg => {
      const card = document.createElement('div');
      card.className = 'shop-card buy-card';

      const badgeHtml = pkg.badge
        ? `<span class="badge badge-popular">${pkg.badge}</span>`
        : '';

      card.innerHTML = `
        <div class="shop-card-icon">${icon('coins', 32)}</div>
        <div class="shop-card-name">${pkg.label}</div>
        <div class="shop-card-price">
          <span class="price-tag buy-price">${pkg.price}</span>
          ${badgeHtml}
        </div>
      `;
      card.addEventListener('click', () => purchaseService.buy(pkg.id));
      grid.appendChild(card);
    });

    return grid;
  }

  _buildGrid(items, type) {
    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    items.forEach(item => {
      const minLevel = item.minLevel || 1;
      const locked   = type === 'tool' && minLevel > this.state.level;
      const owned    = !locked && (this.state.purchasedItems.has(item.id) || item.price === 0 ||
                       (type === 'basket' && item.id === 'basket-s'));
      const active   = !locked && this._isActive(item);
      const canBuy   = !locked && !owned && this.state.score >= item.price;

      const card = document.createElement('div');
      card.className = [
        'shop-card',
        locked                        ? 'locked'    : '',
        owned                         ? 'owned'     : '',
        active                        ? 'active'    : '',
        !locked && !owned && !canBuy  ? 'expensive' : '',
      ].filter(Boolean).join(' ');

      if (locked) {
        card.innerHTML = `
          <div class="shop-card-icon" style="opacity:.4">${icon(item.icon, 32)}</div>
          <div class="shop-card-name">${item.name}</div>
          <div class="shop-card-desc">${item.description}</div>
          <div class="shop-card-price"><span class="badge badge-locked">${icon('lock', 12)} Lv.${minLevel}</span></div>
        `;
      } else {
        card.innerHTML = `
          <div class="shop-card-icon">${icon(item.icon, 32)}</div>
          <div class="shop-card-name">${item.name}</div>
          <div class="shop-card-desc">${item.description || ''}</div>
          <div class="shop-card-price">
            ${active
              ? '<span class="badge badge-active">Actief</span>'
              : owned
              ? '<span class="badge badge-owned">In bezit</span>'
              : `<span class="price-tag">${icon('coins', 12)} ${item.price}</span>`}
          </div>
        `;
        card.addEventListener('click', () => this._handleCardClick(item, type, owned, active));
      }

      grid.appendChild(card);
    });

    return grid;
  }

  _handleCardClick(item, type, owned, active) {
    if (active) return;

    if (owned || item.price === 0) {
      if (type === 'cosmetic') {
        this._activateCosmetic(item);
        this._onPurchase?.(item, 'activate');
      } else if (type === 'basket') {
        this._activateBasket(item);
        this._onPurchase?.(item, 'activate');
      }
      return;
    }

    if (this.state.score < item.price) {
      this._showShopMsg(`Niet genoeg punten! (${item.price} nodig)`);
      return;
    }

    this.state.score -= item.price;
    this.state.purchasedItems.add(item.id);

    if (type === 'tool') {
      this.inv.addTool(item.id);
      this._showShopMsg(`${item.name} toegevoegd aan inventaris!`);
    } else if (type === 'basket') {
      this._activateBasket(item);
      this._showShopMsg(`${item.name} gekocht!`);
    } else {
      this._activateCosmetic(item);
      this._showShopMsg(`${item.name} gekocht!`);
    }

    this._onPurchase?.(item, 'buy');
    this.render();
  }

  _activateBasket(item) {
    this.state.basketCapacity = item.capacity;
    this.state.activeBasket = item.id;
    document.dispatchEvent(new CustomEvent('basket:upgraded', { detail: item }));
  }

  _activateCosmetic(item) {
    this.state.activeCosmetics[item.category] = item.id;
    document.dispatchEvent(new CustomEvent('cosmetic:changed', { detail: item }));
  }

  _isActive(item) {
    if (item.capacity !== undefined) {
      return this.state.activeBasket === item.id ||
             (item.id === 'basket-s' && !this.state.activeBasket);
    }
    return this.state.activeCosmetics[item.category] === item.id;
  }

  _showShopMsg(msg) {
    const el = document.getElementById('shop-message');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => el.classList.remove('visible'), 2500);
  }
}
