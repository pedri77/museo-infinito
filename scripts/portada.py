"""Portada: el cuadro entero (sin el fondo negro de la foto) y un detalle de pinceladas a resolución nativa.

Uso: uv run --with pillow python -I scripts/portada.py
Escribe public/obras/vangogh.webp, public/obras/vangogh-trazo.webp y src/datos/portada.json.
"""
import json
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None
RAIZ = Path(__file__).resolve().parent.parent
im = Image.open(RAIZ / "datos-crudos/grandes/vangogh.jpg").convert("RGB")
g = im.convert("L")
w, h = im.size
# Límites del lienzo: primera fila/columna cuya mediana supera el negro del fondo.
def borde(paso, n, fija):
    for k in paso:
        linea = [g.getpixel((k, y) if fija == "x" else (y, k)) for y in range(0, n, 7)]
        linea.sort()
        if linea[len(linea) // 2] > 40:
            return k
x0, x1 = borde(range(w), h, "x"), borde(range(w - 1, -1, -1), h, "x")
y0, y1 = borde(range(h), w, "y"), borde(range(h - 1, -1, -1), w, "y")
x0, y0, x1, y1 = x0 + 8, y0 + 8, x1 - 8, y1 - 8
lienzo = im.crop((x0, y0, x1, y1))
lw, lh = lienzo.size
lienzo.resize((2000, round(2000 * lh / lw)), Image.LANCZOS).save(RAIZ / "public/obras/vangogh.webp", "WEBP", quality=72, method=6)
# Detalle: remolino de nubes (coordenadas sobre el lienzo recortado).
cx, cy, dw, dh = 0.45, 0.24, 1100, 690
rx0 = round(cx * lw - dw / 2); ry0 = round(cy * lh - dh / 2)
lienzo.crop((rx0, ry0, rx0 + dw, ry0 + dh)).save(RAIZ / "public/obras/vangogh-trazo.webp", "WEBP", quality=82, method=6)
(RAIZ / "src/datos").mkdir(exist_ok=True)
(RAIZ / "src/datos/portada.json").write_text(json.dumps({
    "w": 2000, "h": round(2000 * lh / lw),
    "detalle": [rx0 / lw, ry0 / lh, (rx0 + dw) / lw, (ry0 + dh) / lh], "nativo": [dw, dh]}, indent=1))
print("lienzo", lw, lh, "bordes", x0, y0, x1, y1)
