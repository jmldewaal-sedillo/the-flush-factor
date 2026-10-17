// Emmers, van armoedig naar luxe. `liters` = capaciteit. `model.height` = hoogte in meters in de scène.
// Hengsel (wordt verborgen in de emmerweergave):
//   handleNodes — namen van losse nodes in het GLB, of
//   handleTris  — aantal driehoeken van de losse onderdelen binnen één mesh (touw, knopen, beugel).
// keepNodes — toon alleen deze nodes (voor bestanden met meer dan één emmer).
// inner — binnenmaat in meters (punt 84): hoogte van de bodem en van de rand, en de vrije straal bij bodem en rand.
//   Gemeten op het model (zie de test "binnenmaten kloppen met het model"); de inhoud blijft binnen deze kegel.
export const BUCKETS = [
  { id: 'bucket-rusty', liters: 12, price: 0, minLevel: 1, icon: 'bucket-rusty',
    model: { file: 'assets/models/buckets/rusted_bucket.glb', height: 0.28, handleNodes: ['bucket_low_metal _0', 'bucket_low_metal__0', 'bucket_low_wood_0'],
      inner: { floor: 0.018, top: 0.235, rBottom: 0.028, rTop: 0.092 } } },
  { id: 'bucket-wood', liters: 20, price: 750, minLevel: 1, icon: 'bucket-wood',
    model: { file: 'assets/models/buckets/wooden_bucket.glb', height: 0.30, rotationY: Math.PI / 2, handleTris: [1772, 1344, 1344],
      inner: { floor: 0.021, top: 0.21, rBottom: 0.086, rTop: 0.102 } } },
  { id: 'bucket-plastic', liters: 50, price: 2500, minLevel: 2, icon: 'bucket-plastic',
    model: { file: 'assets/models/buckets/plastic_bucket.glb', height: 0.30, handleTris: [458],
      inner: { floor: 0.013, top: 0.284, rBottom: 0.120, rTop: 0.141 } } },
  { id: 'bucket-metal', liters: 75, price: 12000, minLevel: 5, icon: 'bucket-metal',
    model: { file: 'assets/models/buckets/metal_bucket.glb', height: 0.34, handleNodes: ['ruchka_metall_lp', 'ruchka_lp'],
      inner: { floor: 0.011, top: 0.324, rBottom: 0.112, rTop: 0.148 } } },
  { id: 'bucket-mop', liters: 100, price: 40000, minLevel: 10, icon: 'bucket-mop',
    model: { file: 'assets/models/buckets/mop_bucket.glb', height: 0.22, keepNodes: ['SM_large_bucket_4', 'SM_large_bucket_handle_3'], handleNodes: ['SM_large_bucket_handle_3'],
      inner: { floor: 0.006, top: 0.205, rBottom: 0.128, rTop: 0.163 } } },
];

export const DEFAULT_BUCKET = 'bucket-rusty';
// Spelers van vóór Sprint 9 hadden de houten emmer gratis; zij houden hem (zie state.js).
export const LEGACY_DEFAULT_BUCKET = 'bucket-wood';
// Nog oudere opslag (manden) → emmers.
export const LEGACY_BUCKET_IDS = { 'basket-s': 'bucket-wood', 'basket-m': 'bucket-rusty', 'basket-l': 'bucket-plastic', 'basket-xl': 'bucket-mop' };
