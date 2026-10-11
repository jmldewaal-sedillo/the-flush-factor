// Koppelpunt voor inloggen (ROADMAP punt 69). Nu nog zonder online dienst: elke aanmelding geeft
// 'unavailable' terug en de interface toont dan "Binnenkort beschikbaar". Er worden geen inlogschermen
// nagemaakt; zodra er een echte dienst is (zie het stappenplan in ROADMAP.md) hoeft alleen dit bestand
// te veranderen. In de Android-app (Capacitor) opent signIn() dan via een plug-in het inlogscherm van
// Android zelf; een webvenster (pop-up of omleiding) werkt daar niet. Zie ROADMAP.md, "Capacitor: betalen,
// inloggen en offline".
import { bus } from './events.js';

export const AUTH_PROVIDERS = [
  { id: 'google' },      // tekst op de knop: taalbestanden, profile.<id>
  { id: 'facebook' },
];

export const authService = {
  available: false,
  // → { status: 'unavailable' | 'signed-in' | 'cancelled' | 'error', provider, account? }
  async signIn(provider) {
    bus.emit('auth:pending', { provider });
    return { status: 'unavailable', provider };
  },
  // Koppelt een account aan het bestaande (gast)profiel; de lokale voortgang blijft behouden.
  async linkAccount(provider) {
    return this.signIn(provider);
  },
  async signOut() {
    return { status: 'signed-out' };
  },
};
