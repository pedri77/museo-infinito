"""Miniaturas, color de cada obra y selección de la línea del tiempo.

- Color: tono dominante ponderado por saturación (24 tramos) y color medio de esos píxeles; si casi no
  hay píxeles saturados, la obra va a «grises y blancos» con su color medio.
- Familias para los botones de la rueda: rojos, tierras, amarillos, verdes, azules, violetas, grises.
- Línea del tiempo: hasta LINEA_POR_ERA obras por era, del 5000 a. C. a 1940.
Escribe public/obras/m/<museo>-<id>.webp (240 px) y src/datos/obras.json.
Uso: uv run --with pillow python -I scripts/imagenes.py
"""
from __future__ import annotations

import colorsys
import json
import random
import subprocess
import time
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None
RAIZ = Path(__file__).resolve().parent.parent
UA = "museo-infinito/1.0 (static portfolio site)"
CRUDO = RAIZ / "datos-crudos" / "img"
SALIDA = RAIZ / "public" / "obras" / "m"
TRAMOS = 24
MIN_COLOR = 0.03
ERAS = [(-5000, -1000), (-1000, -300), (-300, 400), (400, 1000), (1000, 1300), (1300, 1450), (1450, 1550), (1550, 1650),
        (1650, 1750), (1750, 1820), (1820, 1860), (1860, 1890), (1890, 1940)]
LINEA_POR_ERA = 5
# Familias por tono en grados (inicio inclusivo). «tierras» = naranjas apagados, marrones y ocres.
FAMILIAS = [("rojos", 345, 15), ("tierras", 15, 48), ("amarillos", 48, 75), ("verdes", 75, 165), ("azules", 165, 255), ("violetas", 255, 345)]
ORDEN_FAM = ["rojos", "tierras", "amarillos", "verdes", "azules", "violetas", "grises"]


def bajar(url: str, destino: Path) -> bytes | None:
    if destino.exists():
        return destino.read_bytes()
    for intento in range(4):
        r = subprocess.run(["curl", "-s", "-L", "-A", UA, "-w", "%{http_code}", "-o", str(destino), url], capture_output=True, text=True)
        if r.stdout == "200" and destino.stat().st_size > 2000:
            time.sleep(0.4)
            return destino.read_bytes()
        destino.unlink(missing_ok=True)
        if r.stdout == "404":
            return None
        time.sleep(2 ** intento * 2)
    return None


def color(im: Image.Image) -> dict:
    """Tono dominante (ponderado por saturación), color medio de ese tono y familia."""
    p = im.convert("RGB").resize((64, 64), Image.BILINEAR)
    pix = list(p.get_flattened_data()) if hasattr(p, "get_flattened_data") else list(p.getdata())
    peso = [0.0] * TRAMOS
    grupos: list[list] = [[] for _ in range(TRAMOS)]
    for r, g, b in pix:
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if s > 0.28 and 0.18 < v < 0.97:
            k = int(h * TRAMOS) % TRAMOS
            peso[k] += s
            grupos[k].append((r, g, b))
    sat = sum(len(x) for x in grupos) / len(pix)
    k = max(range(TRAMOS), key=lambda i: peso[i])
    if sat < MIN_COLOR or not grupos[k]:
        rgb = [round(sum(c[i] for c in pix) / len(pix)) for i in range(3)]
        h, l, _ = colorsys.rgb_to_hls(*(c / 255 for c in rgb))
        return {"familia": "grises", "h": round(h * 360, 1), "l": round(l, 3), "rgb": rgb}
    g = grupos[k]
    rgb = [round(sum(c[i] for c in g) / len(g)) for i in range(3)]
    h, l, _ = colorsys.rgb_to_hls(*(c / 255 for c in rgb))
    grados = h * 360
    fam = next(n for n, a, b in FAMILIAS if (a <= grados < b if a < b else (grados >= a or grados < b)))
    return {"familia": fam, "h": round(grados, 1), "l": round(l, 3), "rgb": rgb}


def main() -> None:
    CRUDO.mkdir(parents=True, exist_ok=True)
    SALIDA.mkdir(parents=True, exist_ok=True)
    obras = json.loads((RAIZ / "datos-crudos" / "obras.json").read_text())
    random.seed(7)
    random.shuffle(obras)
    linea: dict[int, list] = {k: [] for k in range(len(ERAS))}
    elegidas = []
    for n, o in enumerate(obras):
        clave = f'{o["museo"]}-{o["id"]}'
        if not bajar(o["img"], CRUDO / f"{clave}.jpg"):
            continue
        try:
            im = Image.open(CRUDO / f"{clave}.jpg")
            im.load()
        except Exception:
            continue
        c = color(im)
        era = next((k for k, (a, b) in enumerate(ERAS) if a <= o["anio"] < b), None)
        if era is not None and len(linea[era]) < LINEA_POR_ERA:
            linea[era].append(clave)
        m = im.convert("RGB")
        m.thumbnail((240, 240), Image.LANCZOS)
        m.save(SALIDA / f"{clave}.webp", "WEBP", quality=70, method=6)
        elegidas.append({**{k: o[k] for k in ("museo", "titulo", "autor", "cultura", "fecha", "anio", "url")},
                         "clave": clave, "w": m.size[0], "h": m.size[1], "color": c})
        if n % 100 == 0:
            print(" …", n)

    # Rueda: por familia y, dentro, por tono (los rojos de 345° a 15° se desenrollan) o, en grises, por luminosidad.
    def orden(o):
        c = o["color"]
        h = c["h"] - 360 if c["h"] >= 345 else c["h"]
        return (ORDEN_FAM.index(c["familia"]), c["l"] if c["familia"] == "grises" else h, c["l"])

    rueda = [o["clave"] for o in sorted(elegidas, key=orden)]
    cuenta = {f: sum(1 for o in elegidas if o["color"]["familia"] == f) for f in ORDEN_FAM}
    for o in elegidas:  # h y l solo sirven para ordenar
        o["color"] = {"familia": o["color"]["familia"], "rgb": o["color"]["rgb"]}
    salida = {"obras": elegidas, "rueda": rueda, "familias": cuenta, "linea": [x for k in range(len(ERAS)) for x in linea[k]]}
    (RAIZ / "src" / "datos" / "obras.json").write_text(json.dumps(salida, ensure_ascii=False, indent=1))
    print(len(elegidas), "obras;", cuenta, "línea", sum(len(v) for v in linea.values()))


if __name__ == "__main__":
    main()
