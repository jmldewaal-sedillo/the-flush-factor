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
import { t, num, money, itemName, itemDesc } from './i18n/index.js';
import { icon } from './ui/icons.js';
import { purchaseService } from './purchases.js';
import { storage } from './storage.js';

const fmt = n => num(n);
const $ = id => document.getElementById(id);

export class Shop {
  // actions: activateCosmetic(slot, id), toggleDecor(def), setBucket(id), addTool(id), repair(id),
  //          cleanerBought(id), usesLeft(id), toiletReady(), seen(ids), changed()
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
    const open = storage.readSetting('shopOpen');
    return new Set(Array.isArray(open) ? open : []);
  }
  _saveOpen() {
    storage.writeSetting('shopOpen', [...this.open_]);
  }

  // category: open meteen deze categorie en breng hem in beeld (bv. vanaf de lege schoonmaakknop).
  open({ category = null } = {}) {
    if (category) { this.open_.add(category); this._saveOpen(); }
    this.render();
    this.screen.hidden = false;
    document.body.dataset.screen = 'shop';
    if (category) this.list.querySelector(`.shop-category[data-cat="${category}"]`)?.scrollIntoView({ block: 'start' });
  }
  isOpen() { return !this.screen.hidden; }
  // Na een taalwissel.
  refresh() { if (this.isOpen()) this.render(); }
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
        onBuy: i => { this.actions.addTool(i.id); return t('shop.toolAdded', { name: itemName(i) }); },
      };
      case 'care': return {
        items: [...REPAIRS, ...CLEANERS],
        // een reparatie "heb je" als het gebrek weg is (of er nooit was); een schoonmaakmiddel zolang er
        // nog iets van over is (punt 92). Is het op, dan staat het weer te koop.
        owned: i => (i.fixes ? !s.toilet.defects[i.fixes] : this.actions.usesLeft(i.id) > 0),
        ownedLabel: i => (i.fixes ? (s.purchased.has(i.id) ? t('shop.repaired') : t('shop.notNeeded')) : t('shop.usesLeft', { left: this.actions.usesLeft(i.id), total: i.uses })),
        detail: i => t('shop.uses', { n: i.uses }),
        // hoeveel er nog over is, als balkje op de kaart
        meter: i => (i.fixes ? null : this.actions.usesLeft(i.id) / i.uses),
        onBuy: i => {
          if (i.fixes) { this.actions.repair(i.id); return t('shop.repairDone', { name: itemName(i) }); }
          this.actions.cleanerBought(i.id);
          return t('shop.cleanerBought', { name: itemName(i) });
        },
      };
      case 'cosmetic': return {
        items: COSMETIC_LISTS[cat.slot], owned,
        active: i => s.cosmetics[cat.slot] === i.id,
        onUse: i => this.actions.activateCosmetic(cat.slot, i.id),
        // een ander toiletmodel kan pas als het toilet heel en schoon is (punt 79)
        blocked: i => (cat.slot === 'toilet' && i.price > 0 && !this.actions.toiletReady() ? t('shop.toiletFirst') : null),
      };
      case 'decoration': return {
        items: DECORATIONS, owned,
        active: i => s.decor[i.anchor] === i.id, activeLabel: t('shop.placed'),
        onUse: i => { const placed = this.actions.toggleDecor(i); return t(placed ? 'shop.decoPlaced' : 'shop.decoRemoved', { name: itemName(i) }); },
        toggles: true,
      };
      case 'buckets': return {
        items: BUCKETS, owned,
        active: i => s.bucketId === i.id,
        onUse: i => this.actions.setBucket(i.id),
        detail: i => t('shop.liters', { n: i.liters }),
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
    const levelText = next ? t('shop.levelNext', { pts: fmt(Math.max(0, next.minScore - s.score)), n: next.level }) : t('shop.levelMax');

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
        <span class="featured-tag">${icon('star', 13)}${t('shop.featured')}</span>
        <span class="featured-icon">${icon(goal.item.icon, 40)}</span>
        <span class="featured-text">
          <span class="featured-name">${itemName(goal.item)}</span>
          <span class="featured-goal">${s.score >= goal.item.price ? t('shop.goalReady', { name: itemName(goal.item) }) : t('shop.goalNext', { pts: fmt(goal.item.price - s.score), name: itemName(goal.item) })}</span>
          <span class="bar"><span class="bar-fill" style="width:${Math.min(100, s.score / goal.item.price * 100).toFixed(0)}%"></span></span>
        </span>
        <span class="price-tag">${icon('coins', 14)}${fmt(goal.item.price)}</span>
      </button>` : `<div class="shop-progress"><span class="shop-progress-label">${icon('circle-check', 16)}<span>${t('shop.allOwned')}</span></span></div>`}`;

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
      <span class="shop-collection" title="${t('shop.collected')}">
        <span class="shop-category-count">${t('shop.collection', { a: have, b: total })}</span>
        <span class="bar"><span class="bar-fill" style="width:${total ? have / total * 100 : 0}%"></span></span>
      </span>`;

    const head = document.createElement('button');
    head.className = 'shop-category-header';
    head.setAttribute('aria-expanded', String(isOpen));
    head.innerHTML = `
      <span class="shop-category-icon">${icon(cat.icon, 26)}</span>
      <span class="shop-category-text"><span class="shop-category-label">${t(`cat.${cat.id}.label`)}</span><span class="shop-category-blurb">${t(`cat.${cat.id}.blurb`)}</span></span>
      ${fresh ? `<span class="tag tag-new">${t('shop.isNew')}</span>` : ''}
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
      <span class="tag tag-money">${icon('euro', 12)}${t('shop.realMoney')}</span>
      <span class="shop-card-icon">${icon('coins', 36)}</span>
      <span class="shop-card-name">${t('shop.pack', { n: fmt(pkg.coins) })}</span>
      <span class="shop-card-price"><span class="price-tag buy-price">${money(pkg.price)}</span>${pkg.badge ? `<span class="badge badge-popular">${t(`shop.${pkg.badge}`)}</span>` : ''}</span>`;
    card.addEventListener('click', async () => {
      await purchaseService.buy(pkg.id);
      this.say(t('shop.purchaseSoon'));
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
    if (st.levelLocked) status = `<span class="badge badge-locked">${icon('lock', 12)} ${t('shop.lockedLevel', { n: item.minLevel })}</span>`;
    else if (st.blocked) status = `<span class="badge badge-locked">${icon('lock', 12)} ${st.blocked}</span>`;
    else if (st.active) status = `<span class="badge badge-active">${src.activeLabel || t('shop.active')}</span>`;
    else if (st.owned) status = `<span class="badge badge-owned">${icon('check', 12)} ${src.ownedLabel ? src.ownedLabel(item) : t('shop.owned')}</span>`;
    else status = `<span class="price-tag">${icon('coins', 14)}${fmt(item.price)}</span>`;

    const tag = st.isNew ? `<span class="tag tag-new">${t('shop.isNew')}</span>` : st.almost ? `<span class="tag tag-almost">${t('shop.almost')}</span>` : '';
    const meter = st.owned && src.meter ? src.meter(item) : null;
    card.innerHTML = `
      ${tag}
      <span class="shop-card-icon">${icon(item.icon, 36)}</span>
      <span class="shop-card-name">${itemName(item)}</span>
      ${src.detail ? `<span class="shop-card-detail">${src.detail(item)}</span>` : ''}
      <span class="shop-card-desc">${itemDesc(item)}</span>
      ${meter !== null ? `<span class="bar uses-bar"><span class="bar-fill" style="width:${Math.round(meter * 100)}%"></span></span>` : ''}
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
      if (s.score < item.price) return this.say(t('shop.notEnough', { price: fmt(item.price) }));
      s.score -= item.price;
      s.purchased.add(item.id);
      this.actions.seen([item.id]);
      message = src.onBuy ? src.onBuy(item) : (src.onUse?.(item), t('shop.bought', { name: itemName(item) }));
      if (typeof message !== 'string') message = t('shop.bought', { name: itemName(item) });
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
