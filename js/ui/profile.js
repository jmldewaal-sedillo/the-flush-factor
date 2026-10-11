// Profielscherm (punt 69): welkom bij de eerste start, daarna bereikbaar via de scorebubbel.
// Alleen DOM; het echte aanmelden loopt via authService (js/auth.js).
import { AVATARS, DEFAULT_PROFILE, NAME_MAX } from '../data/profile.js';
import { AUTH_PROVIDERS, authService } from '../auth.js';
import { t } from '../i18n/index.js';
import { icon } from './icons.js';

const $ = id => document.getElementById(id);
// Leeg gelaten = "Gast" in de gekozen taal.
const cleanName = raw => String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX) || t('profile.guest');

export class ProfileScreen {
  // getStats() → [{ label, value }]; onSave(profile) wordt aangeroepen bij "Spelen als gast" / "Opslaan"
  constructor({ getProfile, getStats, onSave }) {
    this.getProfile = getProfile;
    this.getStats = getStats;
    this.onSave = onSave;
    this.avatar = DEFAULT_PROFILE.avatar;
    this.welcome = false;

    $('profile-avatars').innerHTML = AVATARS.map((a, i) =>
      `<button type="button" class="avatar-option" data-avatar="${a}" role="radio" aria-label="${t('a.avatar', { n: i + 1 })}" aria-checked="false">${icon(a, 30)}</button>`).join('');
    $('profile-avatars').addEventListener('click', e => {
      const btn = e.target.closest('[data-avatar]');
      if (btn) this._pick(btn.dataset.avatar);
    });
    this._buildAuth();
    $('profile-auth').addEventListener('click', async e => {
      const btn = e.target.closest('[data-provider]');
      if (!btn) return;
      const result = await (this.welcome ? authService.signIn(btn.dataset.provider) : authService.linkAccount(btn.dataset.provider));
      if (result.status === 'unavailable') this._say(t('profile.authSoon'));
    });
    $('profile-name').maxLength = NAME_MAX;
    $('profile-form').addEventListener('submit', e => { e.preventDefault(); this._save(); });
    $('btn-profile-close').addEventListener('click', () => this.close());
    $('profile-screen').addEventListener('click', e => { if (e.target === $('profile-screen') && !this.welcome) this.close(); });
  }

  _buildAuth() {
    $('profile-auth').innerHTML = AUTH_PROVIDERS.map(p =>
      `<button type="button" class="auth-btn" data-provider="${p.id}" aria-describedby="profile-auth-note"><span>${t(`profile.${p.id}`)}</span><span class="soon">${t('profile.soon')}</span></button>`).join('');
  }

  // Na een taalwissel: teksten opnieuw zetten (ook als het scherm openstaat).
  refresh() {
    this._buildAuth();
    document.querySelectorAll('.avatar-option').forEach((b, i) => b.setAttribute('aria-label', t('a.avatar', { n: i + 1 })));
    if (this.isOpen()) this._texts();
  }

  _pick(avatar) {
    this.avatar = AVATARS.includes(avatar) ? avatar : DEFAULT_PROFILE.avatar;
    document.querySelectorAll('.avatar-option').forEach(b => b.setAttribute('aria-checked', String(b.dataset.avatar === this.avatar)));
    $('profile-avatar-big').innerHTML = icon(this.avatar, 44);
  }

  _say(text) {
    const el = $('profile-status');
    el.textContent = text;
    el.classList.remove('visible');
    void el.offsetWidth;
    el.classList.add('visible');
  }

  _save() {
    this.onSave({ name: cleanName($('profile-name').value), avatar: this.avatar });
    this.close(true);
  }

  // welcome = eerste start: geen sluitknop, geen statistieken, knop "Spelen als gast".
  open({ welcome = false } = {}) {
    this.welcome = welcome;
    const profile = this.getProfile() || DEFAULT_PROFILE;
    $('btn-profile-close').hidden = welcome;
    $('profile-stats-block').hidden = welcome;
    $('profile-data-block').hidden = welcome;
    $('profile-name').value = welcome ? '' : (profile.name || '');
    $('profile-status').textContent = '';
    $('profile-status').classList.remove('visible');
    this._pick(profile.avatar);
    this._texts();
    $('profile-screen').hidden = false;
    $('profile-content').scrollTop = 0;
    $('profile-screen').dataset.mode = welcome ? 'welcome' : 'profile';
  }

  _texts() {
    const welcome = this.welcome;
    $('profile-title').textContent = t(welcome ? 'profile.welcomeTitle' : 'profile.title');
    $('profile-intro').textContent = t(welcome ? 'profile.welcomeIntro' : 'profile.intro');
    $('profile-submit').textContent = t(welcome ? 'profile.playAsGuest' : 'profile.save');
    $('profile-auth-title').textContent = t(welcome ? 'profile.orSignIn' : 'profile.linkAccount');
    $('profile-auth-note').textContent = t('profile.authNote');
    $('profile-name').placeholder = t('profile.guest');
    if (!welcome) $('profile-stats').innerHTML = this.getStats().map(s => `<div><dt>${s.label}</dt><dd>${s.value}</dd></div>`).join('');
  }

  close(force = false) {
    if (this.welcome && !force) return;      // eerste start: eerst kiezen
    $('profile-screen').hidden = true;
  }

  isOpen() { return !$('profile-screen').hidden; }
}
