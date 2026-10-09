// Emmers. `liters` = capaciteit. `model.height` = hoogte in meters in de scène.
// Hengsel (wordt verborgen in de emmerweergave):
//   handleNodes — namen van losse nodes in het GLB, of
//   handleTris  — aantal driehoeken van de losse onderdelen binnen één mesh (touw, knopen, beugel).
// keepNodes — toon alleen deze nodes (voor bestanden met meer dan één emmer).
export const BUCKETS = [
  { id: 'bucket-wood', name: 'Houten emmer', liters: 20, price: 0, icon: 'bucket-wood',
    description: 'Standaard. Lekt een beetje, werkt prima.',
    model: { file: 'assets/models/buckets/wooden_bucket.glb', height: 0.30, rotationY: Math.PI / 2, handleTris: [1772, 1344, 1344] } },
  { id: 'bucket-rusty', name: 'Roestige emmer', liters: 30, price: 200, icon: 'bucket-rusty',
    description: 'Gevonden achter de schuur. Karakter!',
    model: { file: 'assets/models/buckets/rusted_bucket.glb', height: 0.33, handleNodes: ['bucket_low_metal _0', 'bucket_low_metal__0', 'bucket_low_wood_0'] } },
  { id: 'bucket-plastic', name: 'Plastic emmer', liters: 50, price: 500, icon: 'bucket-plastic',
    description: 'Knalrood en onverwoestbaar.',
    model: { file: 'assets/models/buckets/plastic_bucket.glb', height: 0.37, handleTris: [458] } },
  { id: 'bucket-metal', name: 'Zinken emmer', liters: 75, price: 900, icon: 'bucket-metal',
    description: 'Voor de serieuze verzamelaar.',
    model: { file: 'assets/models/buckets/metal_bucket.glb', height: 0.42, handleNodes: ['ruchka_metall_lp', 'ruchka_lp'] } },
  { id: 'bucket-mop', name: 'Dweilemmer XL', liters: 100, price: 1500, icon: 'bucket-mop',
    description: 'Eens per maand legen is genoeg.',
    model: { file: 'assets/models/buckets/mop_bucket.glb', height: 0.40, keepNodes: ['SM_large_bucket_4', 'SM_large_bucket_handle_3'], handleNodes: ['SM_large_bucket_handle_3'] } },
];

export const DEFAULT_BUCKET = 'bucket-wood';
// Oude opslag (manden) → nieuwe emmers.
export const LEGACY_BUCKET_IDS = { 'basket-s': 'bucket-wood', 'basket-m': 'bucket-rusty', 'basket-l': 'bucket-plastic', 'basket-xl': 'bucket-mop' };
