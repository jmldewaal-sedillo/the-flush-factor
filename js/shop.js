// ============================================================
// THE FLUSH FACTOR — shop.js
// Winkellogica: tonen, kopen, cosmetica toepassen.
// ============================================================

import { COSMETICS, PREMIUM_TOOLS, BASKET_CONFIG } from './items.js';

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

    const tab = document.querySelector('.shop-tab.active')?.dataset.tab || 'tools';
    container.innerHTML = '';

    if (tab === 'tools') {
      this._renderSection(container, 'Gereedschappen', PREMIUM_TOOLS, 'tool');
    } else if (tab === 'baskets') {
      this._renderSection(container, 'Manden', BASKET_CONFIG, 'basket');
    } else {
      const categories = [
        { key: 'toilet',     label: 'Toiletmodellen' },
        { key: 'tiles',      label: 'Tegelpatronen' },
        { key: 'floor',      label: 'Vloeren' },
        { key: 'decoration', label: 'Decoraties' },
      ];
      categories.forEach(cat => {
        const items = COSMETICS.filter(c => c.category === cat.key);
        this._renderSection(container, cat.label, items, 'cosmetic');
      });
    }
  }

  _renderSection(container, title, items, type) {
    const section = document.createElement('div');
    section.className = 'shop-section';
    section.innerHTML = `<h3 class="shop-section-title">${title}</h3>`;

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
          <div class="shop-card-emoji" style="opacity:.4">${item.emoji}</div>
          <div class="shop-card-name">${item.name}</div>
          <div class="shop-card-desc">${item.description}</div>
          <div class="shop-card-price"><span class="badge badge-locked">🔒 Lv.${minLevel}</span></div>
        `;
      } else {
        card.innerHTML = `
          <div class="shop-card-emoji">${item.emoji}</div>
          <div class="shop-card-name">${item.name}</div>
          <div class="shop-card-desc">${item.description}</div>
          <div class="shop-card-price">
            ${active   ? '<span class="badge badge-active">Actief</span>'  :
              owned    ? '<span class="badge badge-owned">In bezit</span>' :
              `<span class="price-tag">💰 ${item.price}</span>`}
          </div>
        `;
        card.addEventListener('click', () => this._handleCardClick(item, type, owned, active));
      }

      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  }

  _handleCardClick(item, type, owned, active) {
    if (active) return; // al actief, niets doen

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

    // Kopen
    if (this.state.score < item.price) {
      this._showShopMsg(`Niet genoeg punten! (${item.price} nodig)`);
      return;
    }

    this.state.score -= item.price;
    this.state.purchasedItems.add(item.id);

    if (type === 'tool') {
      this.inv.addTool(item.id);
      this._showShopMsg(`${item.emoji} ${item.name} toegevoegd aan inventaris!`);
    } else if (type === 'basket') {
      this._activateBasket(item);
      this._showShopMsg(`${item.emoji} ${item.name} gekocht!`);
    } else {
      this._activateCosmetic(item);
      this._showShopMsg(`${item.emoji} ${item.name} gekocht!`);
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
      // Mand: actief als dit de huidige mand is
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
