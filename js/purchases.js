// Koppelpunt voor echte aankopen (ROADMAP punt 60: Google Play Billing via Digital Goods API).
// Nu nog een stub: er wordt niets afgeschreven en het saldo verandert niet.
import { bus } from './events.js';

export const purchaseService = {
  async buy(productId) {
    bus.emit('purchase:pending', { productId });
    return { status: 'unavailable', productId };
  },
};
