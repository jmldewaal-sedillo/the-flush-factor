// Koppelpunt voor inloggen (ROADMAP punt 69). Nu nog zonder online dienst: elke aanmelding geeft
// 'unavailable' terug en de interface toont dan "Binnenkort beschikbaar". Er worden geen inlogschermen
// nagemaakt; zodra er een echte dienst is (zie het stappenplan in ROADMAP.md) hoeft alleen dit bestand
// te veranderen: signIn() opent dan het officiële venster van de aanbieder.
import { bus } from './events.js';

export const AUTH_PROVIDERS = [
  { id: 'google', label: 'Inloggen met Google' },
  { id: 'facebook', label: 'Inloggen met Facebook' },
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
