#!/usr/bin/env bash
# Comprimeert de originele assets (assets/_unused/originals/) naar de versies die het spel laadt.
# Modellen: textures naar max. 1024 px + WebP (geometrie en node-namen blijven ongewijzigd).
# Vereist: node/npx (haalt @gltf-transform/cli op), ImageMagick (magick).
set -euo pipefail
cd "$(dirname "$0")/.."
O=assets/_unused/originals
GT="npx -y @gltf-transform/cli@4"
TMP=$(mktemp -d)
model() { # bron doel maat
  $GT resize "$1" "$TMP/r.glb" --width "$3" --height "$3" >/dev/null
  $GT webp "$TMP/r.glb" "$2" --quality 82 >/dev/null
  echo "$2: $(du -h "$1" | cut -f1) -> $(du -h "$2" | cut -f1)"
}
model $O/models/toilet-2k.glb                    assets/models/toilet.glb               1024
model $O/models/buckets/wooden_bucket.glb        assets/models/buckets/wooden_bucket.glb  1024
model $O/models/buckets/old_rusted_bucket_v1.glb assets/models/buckets/rusted_bucket.glb  512
model $O/models/buckets/plastic_bucket.glb       assets/models/buckets/plastic_bucket.glb 1024
model $O/models/buckets/metal_bucket.glb         assets/models/buckets/metal_bucket.glb   1024
model $O/models/buckets/pair_of_buckets.glb      assets/models/buckets/mop_bucket.glb     1024
for t in Tiles101 WoodFloor041; do
  magick $O/textures/${t}_1K-JPG_Color.jpg     -quality 82 assets/textures/${t}_color.webp
  magick $O/textures/${t}_1K-JPG_NormalGL.jpg  -quality 85 assets/textures/${t}_normal.webp
  magick $O/textures/${t}_1K-JPG_Roughness.jpg -resize 512x512 -quality 80 assets/textures/${t}_roughness.webp
done
magick $O/hdri/bathroom.hdr -resize 512x256 assets/hdri/bathroom_512.hdr
rm -rf "$TMP"
du -sh assets/models assets/textures assets/hdri
