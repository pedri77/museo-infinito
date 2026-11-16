# Museo infinito

Web cinemática con obras de dominio público (CC0) de The Metropolitan Museum of Art y del Cleveland Museum of Art.

Demo: https://pedri77.github.io/museo-infinito/

## Qué tiene

- **Del trazo a la sala:** la cámara empieza pegada a una nube de *Campo de trigo con cipreses* (Van Gogh, 1889) a resolución nativa, se aleja hasta el cuadro con su cartela y sigue hasta una pared con 150 obras más.
- **El color del museo:** las 741 obras de la página, ordenadas por tono, dan la vuelta a un anillo. Dos de cada tres son «tierras»; azules, verdes y violetas casi no aparecen. Botones por familia de color.
- **5.000 años en una línea:** 65 obras por fecha, del 4710 a. C. a 1936, con la misma línea a escala real debajo.
- **La sala de comparación:** cuatro parejas, una obra de cada museo, frente a la misma pregunta.

## Datos y derechos

- [The Met Open Access API](https://metmuseum.github.io/) (v1.1): muestra fija de 700 de sus obras destacadas, solo las marcadas `isPublicDomain`.
- [Cleveland Museum of Art Open Access API](https://openaccess-api.clevelandart.org/): obras destacadas con licencia `CC0`.
- Imágenes reducidas a WebP. El color de cada obra se calcula sobre su foto (tono dominante ponderado por saturación), así que la luz y el fondo de la foto también cuentan.
- Ningún museo patrocina ni revisa esta página. Textos y código hechos con IA (Claude) y revisados.

```bash
python3 -I scripts/datos.py                                   # fichas (Met + Cleveland)
uv run --with pillow python -I scripts/portada.py             # Van Gogh: cuadro y detalle nativo
uv run --with pillow python -I scripts/imagenes.py            # miniaturas, color y línea del tiempo
uv run --with pillow python -I scripts/sala.py                # imágenes medianas de la sala
```

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3014
npm run lint && npm run build
```

React 19, Vite, Tailwind 4 y Lenis; un solo bucle `requestAnimationFrame`. Respeta `prefers-reduced-motion`. Despliegue a GitHub Pages con `.github/workflows/pages.yml` en cada push a `main`.
