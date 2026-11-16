import {useEffect, useRef} from 'react';
import {LINEA, MUSEOS, anioLegible, firma, linea, miniUrl} from '../content';
import {clamp, lerp, progresoFijado, tramo} from '../lib/math';
import {enCadaFotograma} from '../lib/scroll';

/**
 * 5.000 años en una línea: las obras ordenadas por fecha en una procesión horizontal. Arriba, el año
 * de la obra que pasa por el centro. Abajo, la misma línea a escala real del tiempo: se ve que casi
 * todo lo que guardan los museos es de los últimos 500 años.
 *
 * Guion de scroll (p), sección de N × 12 + 100 svh:
 *   0.03 – 0.97  q = obra continua 0…N−1; la pista se desplaza −q fichas
 *   realce       e = 1 − |k − q| (recortada): escala 0.84 + 0.16e, opacidad 0.45 + 0.55e
 *   año          interpolado entre la obra k y la k+1 (redondeado)
 *   escala real  el marcador recorre la barra en proporción al año interpolado
 */

const N = LINEA.length;
const ALTO_VH = N * 12 + 100;
const A0 = -3500;
const A1 = 1935;
const posReal = (a: number) => (clamp(a, A0, A1) - A0) / (A1 - A0);

export function Linea() {
  const raizRef = useRef<HTMLElement>(null);
  const pistaRef = useRef<HTMLOListElement>(null);
  const anioRef = useRef<HTMLParagraphElement>(null);
  const marcaRef = useRef<HTMLDivElement>(null);
  const fichaRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    let pAnterior = -1;
    let anchoAnterior = 0;
    return enCadaFotograma(() => {
      const raiz = raizRef.current;
      if (!raiz) return;
      const {p, visible} = progresoFijado(raiz);
      const vw = window.innerWidth;
      if (!visible || (Math.abs(p - pAnterior) < 0.00005 && vw === anchoAnterior)) return;
      pAnterior = p;
      anchoAnterior = vw;
      const q = tramo(p, 0.03, 0.97) * (N - 1);
      const ficha = fichaRefs.current[0]?.offsetWidth ?? 300;
      pistaRef.current!.style.transform = `translate3d(${vw / 2 - ficha / 2 - q * ficha}px, 0, 0)`;
      fichaRefs.current.forEach((el, k) => {
        if (!el) return;
        const e = 1 - Math.min(1, Math.abs(k - q));
        el.style.transform = `scale(${0.84 + 0.16 * e})`;
        el.style.opacity = String(0.45 + 0.55 * e);
      });
      const k = Math.min(N - 2, Math.floor(q));
      const a = Math.round(lerp(LINEA[k].anio, LINEA[k + 1].anio, q - k));
      anioRef.current!.textContent = anioLegible(a);
      marcaRef.current!.style.left = `${posReal(a) * 100}%`;
    });
  }, []);

  return (
    <section ref={raizRef} id="tiempo" aria-labelledby="linea-titulo" className="relative" style={{height: `${ALTO_VH}svh`}}>
      <div className="sticky top-0 flex h-pantalla flex-col overflow-hidden bg-pared-2 pt-[4svh] pb-[3svh]">
        <div className="flex items-end justify-between gap-6 px-4 sm:px-6 md:px-[4vw]">
          <div>
            <p className="etiqueta text-cobalto">{linea.antetitulo}</p>
            <h2 id="linea-titulo" className="ancho-estrecho mt-1 font-display text-display font-extrabold uppercase">
              {linea.titulo}
            </h2>
            <p className="mt-2 hidden max-w-[30rem] text-body text-tinta-2 md:block">{linea.cuerpo}</p>
          </div>
          <p
            ref={anioRef}
            className="ancho-estrecho shrink-0 font-display text-[clamp(2.5rem,9vw,8rem)] leading-none font-extrabold text-cobalto tabular-nums"
            aria-hidden="true"
          >
            {anioLegible(LINEA[0].anio)}
          </p>
        </div>

        <ol ref={pistaRef} className="mt-[3svh] flex min-h-0 flex-1 items-stretch will-change-transform">
          {LINEA.map((o, k) => (
            <li
              key={o.clave}
              ref={(el) => {
                fichaRefs.current[k] = el;
              }}
              className="flex w-[62vw] shrink-0 flex-col px-3 sm:w-[40vw] md:w-[22vw] md:px-4"
            >
              <div className="flex min-h-0 flex-1 items-end justify-center">
                <img src={miniUrl(o.clave)} alt="" width={o.w} height={o.h} loading="lazy" decoding="async" className="colgada max-h-full max-w-full object-contain" />
              </div>
              <div className="mt-3 border-t border-tinta pt-2">
                <p className="font-semibold tabular-nums">{anioLegible(o.anio)}</p>
                <p className="mt-0.5 line-clamp-2 font-cartela text-[0.9375rem] leading-snug italic">{o.titulo}</p>
                <p className="mt-0.5 line-clamp-1 text-[0.8125rem] text-tinta-3">
                  {firma(o)} ·{' '}
                  <a href={o.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-cobalto">
                    {MUSEOS[o.museo]}
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Escala real del tiempo */}
        <div className="mt-[3svh] px-4 sm:px-6 md:px-[4vw]" aria-hidden="true">
          <div className="relative h-6">
            <div className="absolute inset-x-0 top-1/2 h-px bg-tinta" />
            {LINEA.map((o) => (
              <div key={o.clave} className="absolute top-1/2 size-1.5 -translate-1/2 rounded-full bg-tinta-3" style={{left: `${posReal(o.anio) * 100}%`}} />
            ))}
            <div ref={marcaRef} className="absolute top-0 h-6 w-0.5 -translate-x-1/2 bg-cobalto" />
          </div>
          <div className="mt-1 flex justify-between text-[0.75rem] text-tinta-3">
            <span>{anioLegible(A0)}</span>
            <span>{linea.escala}</span>
            <span>{A1}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
