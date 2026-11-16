"""Imágenes medianas (1000 px) de las obras de la sala de comparación y su ficha en src/datos/obras.json.

Ejecutar después de imagenes.py. Uso: uv run --with pillow python -I scripts/sala.py
"""
import io
import json
import re
from pathlib import Path

import sys

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import imagenes as im_  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
CLAVES = re.findall(r"[ab]: '((?:met|cma)-\d+)'", (RAIZ / "src/content.ts").read_text())
crudas = {f'{o["museo"]}-{o["id"]}': o for o in json.loads((RAIZ / "datos-crudos/obras.json").read_text())}
salida = json.loads((RAIZ / "src/datos/obras.json").read_text())
ya = {o["clave"] for o in salida["obras"]}
(RAIZ / "public/obras/g").mkdir(parents=True, exist_ok=True)
for c in CLAVES:
    o = crudas[c]
    datos = im_.bajar(o["img"], im_.CRUDO / f"{c}.jpg")
    im = Image.open(io.BytesIO(datos)).convert("RGB")
    col = im_.color(im)
    g = im.copy(); g.thumbnail((1000, 1000), Image.LANCZOS)
    g.save(RAIZ / f"public/obras/g/{c}.webp", "WEBP", quality=74, method=6)
    if c not in ya:
        m = im.copy(); m.thumbnail((320, 320), Image.LANCZOS)
        m.save(RAIZ / f"public/obras/m/{c}.webp", "WEBP", quality=72, method=6)
        salida["obras"].append({**{k: o[k] for k in ("museo", "titulo", "autor", "cultura", "fecha", "anio", "url")},
                                "clave": c, "w": m.size[0], "h": m.size[1], "color": {"familia": col["familia"], "rgb": col["rgb"]}})
(RAIZ / "src/datos/obras.json").write_text(json.dumps(salida, ensure_ascii=False, indent=1))
print(len(CLAVES), "obras de sala")
