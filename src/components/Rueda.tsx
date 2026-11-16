import {useEffect, useMemo, useRef} from 'react';
import {FAMILIAS, MUSEOS, RUEDA, anioLegible, firma, miniUrl, rueda, type Familia} from '../content';
import {progresoFijado, tramo} from '../lib/math';
import {enCadaFotograma, irAPosicion} from '../lib/scroll';

/**
 * El color del museo: todas las obras en fila por tono, cada una un segmento de un anillo. Como dos de
 * cada tres son «tierras», el círculo sale casi entero marrón. El scroll gira el anillo; la obra que
 * queda bajo la flecha aparece en el centro y su familia de color se explica a la derecha.
 *
 * Guion de scroll (p), sección de 700 svh:
 *   0.03 – 0.97  q = índice continuo 0…N−1; giro = −(q + 0.5) / N vueltas
 *   centro       miniatura de la obra round(q) (cambia de src solo cuando cambia el índice)
 *   panel        familia de esa obra: nombre, recuento y texto (se cambia solo al cambiar de familia)
 * Los botones de familia llevan el scroll a la primera obra de esa familia.
 */

const N = RUEDA.length;
const ALTO_VH = 700;
const P0 = 0.03;
const P1 = 0.97;
const R_DENTRO = 0.32;
const R_FUERA = 0.48;
const ORDEN: Familia[] = ['rojos', 'tierras', 'amarillos', 'verdes', 'azules', 'violetas', 'grises'];

/** Segmento de anillo k de N (ángulo 0 arriba, sentido horario) en un viewBox centrado. */
function segmento(k: number) {
  const a0 = (k / N) * Math.PI * 2;
  const a1 = ((k + 1.02) / N) * Math.PI * 2;
  const pt = (r: number, a: number) => `${(r * Math.sin(a)).toFixed(4)} ${(-r * Math.cos(a)).toFixed(4)}`;
  return `M${pt(R_FUERA, a0)}A${R_FUERA} ${R_FUERA} 0 0 1 ${pt(R_FUERA, a1)}L${pt(R_DENTRO, a1)}A${R_DENTRO} ${R_DENTRO} 0 0 0 ${pt(R_DENTRO, a0)}Z`;
}

export function Rueda() {
  const raizRef = useRef<HTMLElement>(null);
  const anilloRef = useRef<SVGGElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const tituloRef = useRef<HTMLParagraphElement>(null);
  const datoRef = useRef<HTMLParagraphElement>(null);
  const enlaceRef = useRef<HTMLAnchorElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const botonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const primera = useMemo(() => Object.fromEntries(ORDEN.map((f) => [f, RUEDA.findIndex((o) => o.color.familia === f)])) as Record<Familia, number>, []);
  const caminos = useMemo(() => RUEDA.map((o, k) => ({d: segmento(k), fill: `rgb(${o.color.rgb.join(' ')})`})), []);

  const irAFamilia = (f: Familia) => {
    const raiz = raizRef.current!;
    const top = raiz.getBoundingClientRect().top + window.scrollY;
    const recorrido = raiz.offsetHeight - window.innerHeight;
    irAPosicion(top + (P0 + ((primera[f] + 0.5) / (N - 1)) * (P1 - P0)) * recorrido);
  };

  useEffect(() => {
    let pAnterior = -1;
    let kAnterior = -1;
    let famAnterior = '';
    return enCadaFotograma(() => {
      const raiz = raizRef.current;
      if (!raiz) return;
      const {p, visible} = progresoFijado(raiz);
      if (!visible || Math.abs(p - pAnterior) < 0.00002) return;
      pAnterior = p;
      const q = tramo(p, P0, P1) * (N - 1);
      anilloRef.current!.setAttribute('transform', `rotate(${(-(q + 0.5) / N) * 360})`);
      const k = Math.round(q);
      if (k === kAnterior) return;
      kAnterior = k;
      const o = RUEDA[k];
      imgRef.current!.src = miniUrl(o.clave);
      imgRef.current!.alt = o.titulo;
      tituloRef.current!.textContent = o.titulo;
      datoRef.current!.textContent = `${firma(o)} · ${anioLegible(o.anio)}`;
      enlaceRef.current!.href = o.url;
      enlaceRef.current!.textContent = `${MUSEOS[o.museo]} ↗`;
      if (o.color.familia !== famAnterior) {
        famAnterior = o.color.familia;
        ORDEN.forEach((f, i) => {
          const pn = panelRefs.current[i];
          if (pn) pn.hidden = f !== famAnterior;
          botonRefs.current[i]?.setAttribute('aria-current', f === famAnterior ? 'true' : 'false');
        });
      }
    });
  }, []);

  return (
    <section ref={raizRef} id="color" aria-label={rueda.titulo} className="relative" style={{height: `${ALTO_VH}svh`}}>
      <div className="sticky top-0 flex h-pantalla flex-col gap-3 overflow-hidden bg-pared px-4 pt-[4svh] sm:px-6 md:flex-row md:items-center md:gap-[5vw] md:px-[4vw] md:pt-0">
        <Cabecera className="md:hidden" />
        <div className="relative mx-auto aspect-square w-[min(84vw,42svh)] shrink-0 md:mx-0 md:w-[min(44vw,82svh)]">
          <svg viewBox="-0.5 -0.5 1 1" className="absolute inset-0 size-full" aria-hidden="true">
            <g ref={anilloRef}>
              {caminos.map((c, k) => (
                <path key={k} d={c.d} fill={c.fill} />
              ))}
            </g>
          </svg>
          {/* Centro: la obra bajo la flecha */}
          <div className="absolute inset-[22%] flex items-center justify-center p-[6%]">
            <img ref={imgRef} src={miniUrl(RUEDA[0].clave)} alt={RUEDA[0].titulo} decoding="async" className="colgada max-h-full max-w-full object-contain" />
          </div>
          <div className="absolute -top-2 left-1/2 size-0 -translate-x-1/2 border-x-[9px] border-t-[14px] border-x-transparent border-t-tinta" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <Cabecera className="hidden md:block" />
          <div className="mt-2 border-l-2 border-tinta pl-3 md:mt-8">
            <p ref={tituloRef} className="line-clamp-2 font-cartela text-body italic" />
            <p ref={datoRef} className="line-clamp-1 text-[0.8125rem] text-tinta-3" />
            <a ref={enlaceRef} target="_blank" rel="noreferrer" className="text-[0.8125rem] text-cobalto underline underline-offset-2" />
          </div>
          <div className="mt-4 md:mt-6">
            {ORDEN.map((f, i) => (
              <div
                key={f}
                ref={(el) => {
                  panelRefs.current[i] = el;
                }}
                hidden={i !== 0}
              >
                <p className="ancho-estrecho font-display text-[clamp(1.5rem,3vw,2.5rem)] leading-none font-extrabold uppercase">{rueda.familias[f].nombre}</p>
                <p className="mt-1 text-[0.875rem] font-semibold tabular-nums">{rueda.de(FAMILIAS[f], N)}</p>
                <p className="mt-2 hidden max-w-[30rem] font-cartela text-body text-tinta-2 sm:block">{rueda.familias[f].texto}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label={rueda.botones}>
            {ORDEN.map((f, i) => (
              <button
                key={f}
                ref={(el) => {
                  botonRefs.current[i] = el;
                }}
                type="button"
                onClick={() => irAFamilia(f)}
                className="flex items-center gap-1.5 border border-linea px-2 py-1 text-[0.75rem] font-semibold aria-[current=true]:border-tinta aria-[current=true]:bg-tinta aria-[current=true]:text-pared"
              >
                <span className="size-2.5 rounded-full" style={{background: `rgb(${RUEDA[primera[f] + Math.floor(FAMILIAS[f] / 2)]?.color.rgb.join(' ')})`}} aria-hidden="true" />
                {rueda.familias[f].nombre} <span className="tabular-nums opacity-70">{FAMILIAS[f]}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 hidden text-[0.75rem] text-tinta-3 md:block">{rueda.aviso}</p>
        </div>
      </div>
    </section>
  );
}

function Cabecera({className}: {className: string}) {
  return (
    <div className={className}>
      <p className="etiqueta text-cobalto">{rueda.antetitulo}</p>
      <h2 className="ancho-estrecho mt-1 font-display text-display font-extrabold uppercase">{rueda.titulo}</h2>
      <p className="mt-2 max-w-[30rem] text-body text-tinta-2">{rueda.cuerpo}</p>
    </div>
  );
}
