// Koppelpunt voor echte aankopen (ROADMAP punt 60). Nu nog een stub: er wordt niets afgeschreven en het
// saldo verandert niet. Straks, in de Android-app (Capacitor): Google Play Billing via een plug-in achter
// deze functie; op web en webportals blijft kopen uit. Zie ROADMAP.md, "Capacitor: betalen, inloggen en offline".
import { bus } from './events.js';

export const purchaseService = {
  async buy(productId) {
    bus.emit('purchase:pending', { productId });
    return { status: 'unavailable', productId };
  },
};
