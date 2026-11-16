"""Reúne obras de dominio público (CC0) de The Met y del Cleveland Museum of Art.

Solo obras destacadas («highlights») con imagen y licencia abierta. Escribe datos-crudos/obras.json.
Uso: python3 -I scripts/datos.py
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import time
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "datos-crudos" / "cache"
UA = "museo-infinito/1.0 (static portfolio site)"
MET = "https://collectionapi.metmuseum.org/public/collection"
MUESTRA_MET = 700
CMA = "https://openaccess-api.clevelandart.org/api/artworks/"


def get_json(url: str, pausa: float = 1.0) -> dict:
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / (hashlib.sha1(url.encode()).hexdigest() + ".json")
    if f.exists():
        return json.loads(f.read_text())
    for intento in range(5):
        r = subprocess.run(["curl", "-s", "-A", UA, "-w", "\n%{http_code}", url], capture_output=True, text=True)
        cuerpo, _, codigo = r.stdout.rpartition("\n")
        if codigo == "200":
            d = json.loads(cuerpo)
            f.write_text(json.dumps(d))
            time.sleep(pausa)
            return d
        if codigo == "404":
            f.write_text("{}")
            return {}
        print("  reintento", codigo, url)
        time.sleep(2 ** intento * 3)
    print("  saltada", url)
    return {}


def met() -> list[dict]:
    ids: list[int] = []
    off = 0
    while True:
        q = urllib.parse.urlencode({"isHighlight": "true", "hasImages": "true", "q": "*", "offset": off, "limit": 500})
        d = get_json(f"{MET}/v1.1/search?{q}")
        lote = d.get("objectIDs") or []
        ids += lote
        off += len(lote)
        if not lote or off >= d.get("total", 0):
            break
    print("met ids", len(ids))
    # Muestra fija: con 700 obras destacadas hay de sobra para la rueda y la línea del tiempo.
    import random
    random.Random(7).shuffle(ids)
    ids = ids[:MUESTRA_MET]
    salida = []
    for n, i in enumerate(ids):
        o = get_json(f"{MET}/v1/objects/{i}")
        if n % 200 == 0:
            print(" …", n)
        if not o.get("isPublicDomain") or not o.get("primaryImageSmall"):
            continue
        salida.append({
            "museo": "met", "id": o["objectID"], "titulo": o.get("title") or "", "autor": o.get("artistDisplayName") or "",
            "cultura": o.get("culture") or "", "fecha": o.get("objectDate") or "", "anio": o.get("objectBeginDate"),
            "departamento": o.get("department") or "", "tecnica": o.get("medium") or "", "tipo": o.get("classification") or o.get("objectName") or "",
            "img": o["primaryImageSmall"], "img_grande": o.get("primaryImage") or "", "url": o.get("objectURL") or "",
        })
    return salida


def cma() -> list[dict]:
    salida = []
    skip = 0
    while True:
        q = urllib.parse.urlencode({"cc0": 1, "has_image": 1, "highlight": 1, "limit": 100, "skip": skip})
        d = get_json(f"{CMA}?{q}")
        for a in d.get("data", []):
            web = (a.get("images") or {}).get("web") or {}
            if a.get("share_license_status") != "CC0" or not web.get("url"):
                continue
            cre = (a.get("creators") or [{}])
            salida.append({
                "museo": "cma", "id": a["id"], "titulo": a.get("title") or "", "autor": (cre[0] or {}).get("description") or "",
                "cultura": ", ".join(a.get("culture") or []), "fecha": a.get("creation_date") or "", "anio": a.get("creation_date_earliest"),
                "departamento": a.get("department") or "", "tecnica": a.get("technique") or "", "tipo": a.get("type") or "",
                "img": web["url"], "img_grande": ((a.get("images") or {}).get("print") or {}).get("url") or "", "url": a.get("url") or "",
            })
        skip += 100
        if skip >= d.get("info", {}).get("total", 0):
            break
    return salida


def main() -> None:
    obras = met() + cma()
    obras = [o for o in obras if isinstance(o["anio"], int)]
    (RAIZ / "datos-crudos" / "obras.json").write_text(json.dumps(obras, ensure_ascii=False, indent=1))
    por = {}
    for o in obras:
        por[o["museo"]] = por.get(o["museo"], 0) + 1
    print(len(obras), por, "años", min(o["anio"] for o in obras), max(o["anio"] for o in obras))


if __name__ == "__main__":
    main()
