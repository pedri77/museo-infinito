import {useEffect, useMemo, useRef} from 'react';
import {OBRAS, PORTADA, RUEDA, grandeUrl, miniUrl, portada} from '../content';
import {easeInOutSine, easeOutCubic, lerp, progresoFijado, tramo} from '../lib/math';
import {enCadaFotograma} from '../lib/scroll';

/**
 * Del trazo a la sala: una cámara que empieza pegada a una nube de Van Gogh (detalle a resolución
 * nativa), se aleja hasta el cuadro entero con su cartela y sigue alejándose hasta una pared blanca
 * llena de obras. Al final, el titular.
 *
 * Mundo: el cuadro mide 1 × ASPECTO (unidades de ancho del cuadro) y está centrado en el origen.
 * Las obras de la pared ocupan celdas de CELDA × CELDA alrededor, ordenadas por distancia al centro.
 *
 * Guion de scroll (p), sección de 600 svh:
 *   0.00 – 0.06  pegado a la nube (z0: el detalle llena la pantalla)
 *   0.06 – 0.40  zoom de z0 a 1 en logaritmo (easeInOutSine); el foco va de la nube al centro
 *                el detalle nativo se funde cuando la escala baja de 2,4 a 1,6
 *   0.38 – 0.50  cartela del cuadro (entra y se queda hasta 0.62)
 *   0.50 – 0.80  zoom de 1 a zFin; las obras de la pared aparecen de dentro afuera
 *   0.78 – 0.92  la pared se aclara (velo al 35 %) y el titular sube desde abajo en una banda de pared
 *   capítulos    cada uno en su tramo con fundido de 0.025
 */

const ALTO_VH = 600;
const ASPECTO = PORTADA.h / PORTADA.w;
const CELDA = 0.46;
/** Píxeles del mundo por unidad (ancho del cuadro): las sombras y bordes se escalan con él. */
const U = 1000;
const [DX0, DY0, DX1, DY1] = PORTADA.detalle;

type Celda = {clave: string; x: number; y: number; d: number};

/** Celdas de la pared en espiral alrededor del cuadro (que ocupa 3 × 3 celdas centrales aprox.). */
function paredCeldas(claves: string[]): Celda[] {
  const celdas: Omit<Celda, 'clave'>[] = [];
  for (let i = -9; i <= 9; i++)
    for (let j = -6; j <= 6; j++) {
      const x = i * CELDA;
      const y = j * CELDA;
      if (Math.abs(x) < 0.5 + CELDA * 0.55 && Math.abs(y) < ASPECTO / 2 + CELDA * 0.55) continue;
      celdas.push({x, y, d: Math.hypot(x, y * 1.4)});
    }
  celdas.sort((a, b) => a.d - b.d);
  return celdas.slice(0, claves.length).map((c, k) => ({...c, clave: claves[k]}));
}

export function Portada() {
  const raizRef = useRef<HTMLElement>(null);
  const mundoRef = useRef<HTMLDivElement>(null);
  const detalleRef = useRef<HTMLImageElement>(null);
  const cartelaRef = useRef<HTMLDivElement>(null);
  const veloRef = useRef<HTMLDivElement>(null);
  const tituloRef = useRef<HTMLDivElement>(null);
  const invitaRef = useRef<HTMLParagraphElement>(null);
  const capRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const obraRefs = useRef<(HTMLDivElement | null)[]>([]);

  const celdas = useMemo(() => {
    // Una muestra fija y mezclada (cada 4.ª obra en orden de color): la pared no sale ordenada por tono.
    const claves = RUEDA.filter((o, k) => k % 3 === 1 && o.w / o.h > 0.4 && o.w / o.h < 2.5).map((o) => o.clave);
    const mezcla = claves.map((c, k) => ({c, o: (k * 37) % claves.length})).sort((a, b) => a.o - b.o);
    return paredCeldas(mezcla.map((x) => x.c).slice(0, 150));
  }, []);
  const dMax = celdas.length ? celdas[celdas.length - 1].d : 1;

  useEffect(() => {
    let pAnterior = -1;
    let anchoAnterior = 0;
    return enCadaFotograma(() => {
      const raiz = raizRef.current;
      if (!raiz) return;
      const {p, visible} = progresoFijado(raiz);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (!visible || (Math.abs(p - pAnterior) < 0.00005 && vw === anchoAnterior)) return;
      pAnterior = p;
      anchoAnterior = vw;
      const movil = vw < 768;

      // Ancho del cuadro (px) a escala 1: cabe en el 62 % del alto y el 78 % del ancho.
      const W = Math.min(vh * (movil ? 0.5 : 0.62) / ASPECTO, vw * (movil ? 0.86 : 0.6));
      // z0: el detalle cubre la pantalla.
      const z0 = Math.max(vw / ((DX1 - DX0) * W), vh / ((DY1 - DY0) * ASPECTO * W));
      // zFin: la pared se ve hasta ~4,5 celdas de distancia en horizontal.
      const zFin = vw / (W * CELDA * (movil ? 6 : 13));

      let z: number;
      let fx: number;
      let fy: number;
      const centroX = vw * (movil ? 0.5 : 0.58);
      let cx = centroX;
      if (p < 0.5) {
        const s = easeInOutSine(tramo(p, 0.06, 0.4));
        z = Math.exp(lerp(Math.log(z0), 0, s));
        fx = lerp((DX0 + DX1) / 2 - 0.5, 0, s);
        fy = lerp(((DY0 + DY1) / 2 - 0.5) * ASPECTO, 0, s);
        cx = lerp(vw / 2, centroX, s);
      } else {
        const s = easeInOutSine(tramo(p, 0.5, 0.8));
        z = Math.exp(lerp(0, Math.log(zFin), s));
        fx = 0;
        fy = 0;
        cx = lerp(centroX, vw / 2, s);
      }
      // Al subir el titular, la pared sube con él para que el cuadro quede a la vista.
      const cy = lerp(vh * (movil ? 0.42 : 0.5), vh * 0.3, easeOutCubic(tramo(p, 0.78, 0.92)));
      // El mundo mide U px por unidad; se escala desde su origen (el centro del cuadro) a W·z px por unidad.
      mundoRef.current!.style.transform = `translate3d(${cx - fx * W * z}px, ${cy - fy * W * z}px, 0) scale(${(W * z) / U})`;
      detalleRef.current!.style.opacity = String(tramo(z, 1.6, 2.4));

      const crece = tramo(p, 0.5, 0.82);
      obraRefs.current.forEach((el, k) => {
        if (!el) return;
        const d = celdas[k].d / dMax;
        el.style.opacity = String(easeOutCubic(tramo(crece, d * 0.75, d * 0.75 + 0.18)));
      });

      cartelaRef.current!.style.opacity = String(Math.min(tramo(p, 0.38, 0.44), 1 - tramo(p, 0.56, 0.62)));
      cartelaRef.current!.style.transform = `translate3d(0, ${(1 - easeOutCubic(tramo(p, 0.38, 0.46))) * 16}px, 0)`;
      invitaRef.current!.style.opacity = String(1 - tramo(p, 0, 0.03));
      portada.capitulos.forEach((c, k) => {
        const el = capRefs.current[k];
        if (el) el.style.opacity = String(Math.min(tramo(p, c.desde, c.desde + 0.025), 1 - tramo(p, c.hasta - 0.025, c.hasta)));
      });
      veloRef.current!.style.opacity = String(0.35 * tramo(p, 0.78, 0.88));
      const t = easeOutCubic(tramo(p, 0.78, 0.92));
      tituloRef.current!.style.transform = `translate3d(0, ${(1 - t) * 105}%, 0)`;
    });
  }, [celdas, dMax]);

  return (
    <section ref={raizRef} id="inicio" aria-labelledby="portada-titulo" className="relative" style={{height: `${ALTO_VH}svh`}}>
      <div className="sticky top-0 h-pantalla overflow-hidden bg-pared">
        <div ref={mundoRef} className="absolute top-0 left-0 size-px origin-top-left will-change-transform" role="img" aria-label={portada.etiqueta}>
          {/* El cuadro: 1 × ASPECTO unidades, centrado en el origen. */}
          <div className="colgada absolute" style={{left: -0.5 * U, top: (-ASPECTO / 2) * U, width: U, height: ASPECTO * U}}>
            <img src={grandeUrl('vangogh')} alt="" width={PORTADA.w} height={PORTADA.h} decoding="async" fetchPriority="high" className="block size-full" />
            <img
              ref={detalleRef}
              src={grandeUrl('vangogh-trazo')}
              alt=""
              width={PORTADA.nativo[0]}
              height={PORTADA.nativo[1]}
              decoding="async"
              fetchPriority="high"
              className="absolute block"
              style={{left: `${DX0 * 100}%`, top: `${DY0 * 100}%`, width: `${(DX1 - DX0) * 100}%`, height: `${(DY1 - DY0) * 100}%`}}
            />
          </div>
          {celdas.map((c, k) => {
            const o = OBRAS.find((x) => x.clave === c.clave)!;
            const lado = CELDA * 0.74;
            const esc = Math.min(lado / o.w, lado / o.h);
            return (
              <div
                key={c.clave}
                ref={(el) => {
                  obraRefs.current[k] = el;
                }}
                className="absolute"
                style={{left: (c.x - (o.w * esc) / 2) * U, top: (c.y - (o.h * esc) / 2) * U, width: o.w * esc * U, height: o.h * esc * U, opacity: 0}}
              >
                <img src={miniUrl(c.clave)} alt="" width={o.w} height={o.h} loading="lazy" decoding="async" className="colgada block size-full" />
              </div>
            );
          })}
        </div>

        {/* Capítulos: arriba a la izquierda, como un rótulo de sala. */}
        {portada.capitulos.map((c, k) => (
          <p
            key={k}
            ref={(el) => {
              capRefs.current[k] = el;
            }}
            className="absolute top-[5svh] left-4 max-w-[30rem] bg-pared px-4 py-3 text-lead font-medium text-tinta sm:left-6 md:left-[4vw]"
            style={{opacity: 0}}
          >
            {c.texto}
          </p>
        ))}

        <div
          ref={cartelaRef}
          className="absolute right-4 bottom-[4svh] left-4 max-w-[22rem] border-l-2 border-tinta bg-pared py-1 pl-4 md:top-1/2 md:right-auto md:bottom-auto md:left-[4vw] md:-translate-y-1/2"
          style={{opacity: 0}}
        >
          <p className="font-semibold">{portada.cartela.autor}</p>
          <p className="font-cartela text-lead italic">{portada.cartela.titulo}</p>
          <p className="mt-1 text-[0.875rem] text-tinta-2">{portada.cartela.fecha}</p>
          <p className="mt-3 hidden font-cartela text-body text-tinta-2 md:block">{portada.cartela.nota}</p>
          <a href={portada.cartela.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[0.875rem] text-cobalto underline underline-offset-4">
            {portada.cartela.lugar} ↗
          </a>
        </div>

        <div ref={veloRef} className="pointer-events-none absolute inset-0 bg-pared" style={{opacity: 0}} />
        <div ref={tituloRef} className="absolute inset-x-0 bottom-0 border-t border-tinta bg-pared px-4 pt-[4svh] pb-[6svh] sm:px-6 md:px-[4vw]" style={{transform: 'translate3d(0, 105%, 0)'}}>
          <p className="etiqueta text-cobalto">{portada.antetitulo}</p>
          <h1 id="portada-titulo" className="ancho-estrecho mt-2 font-display text-hero font-extrabold tracking-[-0.03em] uppercase">
            {portada.titulo}
          </h1>
          <p className="mt-4 max-w-[34rem] text-lead text-tinta-2">{portada.bajada(OBRAS.length)}</p>
        </div>

        <p ref={invitaRef} className="etiqueta absolute bottom-[3svh] left-1/2 -translate-x-1/2 bg-pared px-3 py-1.5 whitespace-nowrap">
          {portada.invitacion} ↓
        </p>
      </div>
    </section>
  );
}
