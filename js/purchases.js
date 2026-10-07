// ============================================================
// THE FLUSH FACTOR — purchases.js
// Puntenpakketten en aankoop-koppelpunt (punt 41).
// ============================================================

export const PACKAGES = [
  { id: 'pack_500',   label: '500 punten',    coins: 500,   price: '€ 0,99' },
  { id: 'pack_1500',  label: '1.500 punten',  coins: 1500,  price: '€ 2,49', badge: 'populair' },
  { id: 'pack_5000',  label: '5.000 punten',  coins: 5000,  price: '€ 6,99', badge: 'populair' },
  { id: 'pack_15000', label: '15.000 punten', coins: 15000, price: '€ 17,99', badge: 'beste deal' },
];

// Koppelpunt voor Digital Goods API / Google Play Billing (punt 41).
// Dispatchet een CustomEvent zodat shop.js of een toekomstige native handler
// de betaling kan afhandelen.
export const purchaseService = {
  buy(productId) {
    document.dispatchEvent(new CustomEvent('purchase:pending', { detail: { productId } }));
  },
};
