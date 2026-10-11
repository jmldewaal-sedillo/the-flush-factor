// Winkel (punten 51 en 85): uitklapbare categorieën met eigen kleur, een uitgelicht item, voortgang naar
// het volgende level, "Nieuw!"- en "Bijna betaalbaar!"-labels en een collectie per categorie.
// Eerlijk: geen timers of "laatste kans"; echt geld staat apart, met de prijs in euro's.
import { SHOP_CATEGORIES, ALMOST_AFFORDABLE } from './data/shop.js';
import { SHOP_TOOLS } from './data/tools.js';
import { BUCKETS } from './data/buckets.js';
import { COSMETIC_LISTS, DECORATIONS } from './data/cosmetics.js';
import { REPAIRS, CLEANERS } from './data/care.js';
import { PACKAGES } from './data/packages.js';
import { LEVELS } from './data/levels.js';
import { T } from './data/texts.js';
import { icon } from './ui/icons.js';
import { purchaseService } from './purchases.js';

const OPEN_KEY = 'flushfactor_shop_open';
const fmt = n => n.toLocaleString('nl-NL');
const $ = id => document.getElementById(id);

export class Shop {
  // actions: activateCosmetic(slot, id), toggleDecor(def), setBucket(id), addTool(id), repair(id),
  //          cleanerBought(), toiletReady(), seen(ids), changed()
  constructor(state, actions) {
    this.state = state;
    this.actions = actions;
    this.screen = $('shop-screen');
    this.list = $('shop-items');
    this.top = $('shop-top');
    this.msg = $('shop-message');
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
    // Wat je in een open categorie hebt gezien is daarna niet meer "nieuw".
    const seen = [];
    for (const cat of SHOP_CATEGORIES) {
      if (this.open_.has(cat.id)) seen.push(...this._source(cat).items.filter(i => this.state.newItems.includes(i.id)).map(i => i.id));
    }
    if (seen.length) this.actions.seen(seen);
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
        onBuy: i => { this.actions.addTool(i.id); return T.shop.toolAdded(i.name); },
      };
      case 'care': return {
        items: [...REPAIRS, ...CLEANERS],
        // een reparatie "heb je" als het gebrek weg is (of er nooit was)
        owned: i => (i.fixes ? !s.toilet.defects[i.fixes] : s.purchased.has(i.id)),
        ownedLabel: i => (i.fixes ? (s.purchased.has(i.id) ? T.shop.repaired : T.shop.notNeeded) : T.shop.owned),
        onBuy: i => {
          if (i.fixes) { this.actions.repair(i.id); return T.shop.repairDone(i.name); }
          this.actions.cleanerBought();
          return T.shop.cleanerBought(i.name);
        },
      };
      case 'cosmetic': return {
        items: COSMETIC_LISTS[cat.slot], owned,
        active: i => s.cosmetics[cat.slot] === i.id,
        onUse: i => this.actions.activateCosmetic(cat.slot, i.id),
        // een ander toiletmodel kan pas als het toilet heel en schoon is (punt 79)
        blocked: i => (cat.slot === 'toilet' && i.price > 0 && !this.actions.toiletReady() ? T.shop.toiletFirst : null),
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

  // Wat een speler nu met dit item kan: gekocht, op slot (level of voorwaarde), betaalbaar…
  _status(item, src) {
    const s = this.state;
    const owned = src.owned(item);
    const levelLocked = !owned && (item.minLevel || 1) > s.level;
    const blocked = !owned && !levelLocked ? (src.blocked?.(item) || null) : null;
    const buyable = !owned && !levelLocked && !blocked;
    return {
      owned, levelLocked, blocked, buyable,
      active: owned && (src.active?.(item) || false),
      affordable: buyable && s.score >= item.price,
      almost: buyable && s.score < item.price && s.score >= item.price * ALMOST_AFFORDABLE,
      isNew: buyable && s.newItems.includes(item.id),
    };
  }

  render() {
    this._renderTop();
    this.list.textContent = '';
    for (const cat of SHOP_CATEGORIES) this.list.appendChild(this._category(cat));
  }

  // Bovenaan: voortgang naar het volgende level en het uitgelichte item (het goedkoopste dat je nog kunt kopen).
  _renderTop() {
    const s = this.state;
    const next = LEVELS.find(l => l.level === s.level + 1);
    const cur = LEVELS.find(l => l.level === s.level);
    const levelPct = next ? Math.min(100, Math.max(0, (s.score - cur.minScore) / (next.minScore - cur.minScore) * 100)) : 100;
    const levelText = next ? T.shop.levelNext(fmt(Math.max(0, next.minScore - s.score)), next.level) : T.shop.levelMax;

    let goal = null;
    for (const cat of SHOP_CATEGORIES) {
      if (cat.source === 'packages') continue;
      const src = this._source(cat);
      for (const item of src.items) {
        if (!this._status(item, src).buyable) continue;
        if (!goal || item.price < goal.item.price) goal = { item, cat, src };
      }
    }

    this.top.innerHTML = `
      <div class="shop-progress" id="shop-level">
        <span class="shop-progress-label">${icon('arrow-up', 16)}<span>${levelText}</span></span>
        <span class="bar"><span class="bar-fill" style="width:${levelPct.toFixed(0)}%"></span></span>
      </div>
      ${goal ? `
      <button class="shop-featured" id="shop-featured" data-id="${goal.item.id}" data-cat="${goal.cat.id}" style="--cat:${goal.cat.color}">
        <span class="featured-tag">${icon('star', 13)}${T.shop.featured}</span>
        <span class="featured-icon">${icon(goal.item.icon, 40)}</span>
        <span class="featured-text">
          <span class="featured-name">${goal.item.name}</span>
          <span class="featured-goal">${s.score >= goal.item.price ? T.shop.goalReady(goal.item.name) : T.shop.goalNext(fmt(goal.item.price - s.score), goal.item.name)}</span>
          <span class="bar"><span class="bar-fill" style="width:${Math.min(100, s.score / goal.item.price * 100).toFixed(0)}%"></span></span>
        </span>
        <span class="price-tag">${icon('coins', 14)}${fmt(goal.item.price)}</span>
      </button>` : `<div class="shop-progress"><span class="shop-progress-label">${icon('circle-check', 16)}<span>${T.shop.allOwned}</span></span></div>`}`;

    const featured = $('shop-featured');
    if (featured) featured.addEventListener('click', () => {
      // Open de categorie en breng de kaart in beeld; kopen doe je op de kaart zelf.
      this.open_.add(goal.cat.id); this._saveOpen(); this.render();
      const card = this.list.querySelector(`.shop-card[data-id="${goal.item.id}"]`);
      card?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      card?.classList.add('spotlight');
    });
  }

  _category(cat) {
    const isOpen = this.open_.has(cat.id);
    const src = this._source(cat);
    const wrap = document.createElement('section');
    wrap.className = 'shop-category';
    wrap.dataset.cat = cat.id;
    wrap.style.setProperty('--cat', cat.color);

    const isMoney = cat.source === 'packages';
    const total = src.items.length, have = isMoney ? 0 : src.items.filter(src.owned).length;
    const fresh = !isMoney && src.items.some(i => this._status(i, src).isNew);
    const collection = isMoney ? '' : `
      <span class="shop-collection" title="Verzameld">
        <span class="shop-category-count">${T.shop.collection(have, total)}</span>
        <span class="bar"><span class="bar-fill" style="width:${total ? have / total * 100 : 0}%"></span></span>
      </span>`;

    const head = document.createElement('button');
    head.className = 'shop-category-header';
    head.setAttribute('aria-expanded', String(isOpen));
    head.innerHTML = `
      <span class="shop-category-icon">${icon(cat.icon, 26)}</span>
      <span class="shop-category-text"><span class="shop-category-label">${cat.label}</span><span class="shop-category-blurb">${cat.blurb}</span></span>
      ${fresh ? `<span class="tag tag-new">${T.shop.isNew}</span>` : ''}
      ${collection}
      ${icon('chevron-down', 20, 'shop-category-arrow')}`;

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

  // Echt geld: altijd de prijs in euro's, en duidelijk anders dan punten.
  _packageCard(pkg) {
    const card = document.createElement('button');
    card.className = 'shop-card buy-card';
    card.dataset.id = pkg.id;
    card.innerHTML = `
      <span class="tag tag-money">${icon('euro', 12)}${T.shop.realMoney}</span>
      <span class="shop-card-icon">${icon('coins', 36)}</span>
      <span class="shop-card-name">${pkg.label}</span>
      <span class="shop-card-price"><span class="price-tag buy-price">${pkg.price}</span>${pkg.badge ? `<span class="badge badge-popular">${pkg.badge}</span>` : ''}</span>`;
    card.addEventListener('click', async () => {
      await purchaseService.buy(pkg.id);
      this.say(T.shop.purchaseSoon);
    });
    return card;
  }

  _card(item, src) {
    const st = this._status(item, src);
    const card = document.createElement('button');
    card.className = ['shop-card', (st.levelLocked || st.blocked) && 'locked', st.owned && 'owned', st.active && 'active', st.buyable && !st.affordable && 'expensive', st.isNew && 'is-new', st.almost && 'is-almost'].filter(Boolean).join(' ');
    card.dataset.id = item.id;
    card.disabled = st.levelLocked;

    let status;
    if (st.levelLocked) status = `<span class="badge badge-locked">${icon('lock', 12)} ${T.shop.lockedLevel(item.minLevel)}</span>`;
    else if (st.blocked) status = `<span class="badge badge-locked">${icon('lock', 12)} ${st.blocked}</span>`;
    else if (st.active) status = `<span class="badge badge-active">${src.activeLabel || T.shop.active}</span>`;
    else if (st.owned) status = `<span class="badge badge-owned">${icon('check', 12)} ${src.ownedLabel ? src.ownedLabel(item) : T.shop.owned}</span>`;
    else status = `<span class="price-tag">${icon('coins', 14)}${fmt(item.price)}</span>`;

    const tag = st.isNew ? `<span class="tag tag-new">${T.shop.isNew}</span>` : st.almost ? `<span class="tag tag-almost">${T.shop.almost}</span>` : '';
    card.innerHTML = `
      ${tag}
      <span class="shop-card-icon">${icon(item.icon, 36)}</span>
      <span class="shop-card-name">${item.name}</span>
      ${src.detail ? `<span class="shop-card-detail">${src.detail(item)}</span>` : ''}
      <span class="shop-card-desc">${item.description || ''}</span>
      <span class="shop-card-price">${status}</span>`;

    if (!st.levelLocked) card.addEventListener('click', () => this._click(item, src, card));
    return card;
  }

  _click(item, src, card) {
    const s = this.state;
    const st = this._status(item, src);
    let message = null, bought = false;
    if (st.blocked) return this.say(st.blocked);
    if (st.owned) {
      if ((st.active && !src.toggles) || !src.onUse) return;
      message = src.onUse(item);
    } else {
      if (s.score < item.price) return this.say(T.shop.notEnough(fmt(item.price)));
      s.score -= item.price;
      s.purchased.add(item.id);
      this.actions.seen([item.id]);
      message = src.onBuy ? src.onBuy(item) : (src.onUse?.(item), T.shop.bought(item.name));
      if (typeof message !== 'string') message = T.shop.bought(item.name);
      bought = true;
    }
    const rect = card.getBoundingClientRect();
    this.actions.changed();
    this.render();
    if (bought) this._celebrate(rect);
    if (typeof message === 'string') this.say(message);
  }

  // Feestje bij een aankoop: confetti vanaf de kaart en muntjes naar het saldo.
  _celebrate(from) {
    const layer = $('shop-fx');
    const cx = from.left + from.width / 2, cy = from.top + from.height / 2;
    const target = $('shop-score').getBoundingClientRect();
    const colors = ['#ffd23f', '#ef3e36', '#7be0c3', '#3d9be9', '#ffffff'];
    for (let i = 0; i < 26; i++) {
      const el = document.createElement('span');
      el.className = 'shop-confetti';
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 110;
      el.style.cssText = `left:${cx}px;top:${cy}px;background:${colors[i % colors.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 40}px;--rot:${Math.random() * 720 - 360}deg;animation-delay:${Math.random() * 0.08}s`;
      layer.appendChild(el);
    }
    for (let i = 0; i < 6; i++) {
      const el = document.createElement('span');
      el.className = 'shop-coin';
      el.innerHTML = icon('coins', 20);
      el.style.cssText = `left:${cx}px;top:${cy}px;--dx:${target.left + target.width / 2 - cx}px;--dy:${target.top + target.height / 2 - cy}px;animation-delay:${i * 0.06}s`;
      layer.appendChild(el);
    }
    const score = $('shop-score');
    score.classList.remove('bump'); void score.offsetWidth; score.classList.add('bump');
    setTimeout(() => { layer.textContent = ''; }, 1400);
  }

  say(text) {
    this.msg.textContent = text;
    this.msg.classList.remove('visible');
    void this.msg.offsetWidth;          // herstart de animatie, ook bij dezelfde tekst
    this.msg.classList.add('visible');
    clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => this.msg.classList.remove('visible'), 2600);
  }
}
