import {useEffect, useRef} from 'react';
import {MUSEOS, POR_CLAVE, anioLegible, firma, medianaUrl, sala, type Obra} from '../content';
import {easeOutCubic, progresoFijado, tramo} from '../lib/math';
import {enCadaFotograma} from '../lib/scroll';
import {useAparecer} from '../hooks/useAparecer';

/**
 * La sala de comparación: una obra de cada museo frente a frente, con una pregunta en medio.
 * Cada par es una pantalla fijada.
 *
 * Guion de scroll (p) de cada par, 220 svh:
 *   0.00 – 0.40  las obras entran desde los lados (±38 vw, easeOutCubic) y se enderezan (±4° → 0)
 *   0.15 – 0.40  la pregunta y el texto aparecen
 *   0.40 – 1.00  quietas, para mirar
 */

function Par({par, n}: {par: (typeof sala.pares)[number]; n: number}) {
  const raizRef = useRef<HTMLElement>(null);
  const ladoRefs = useRef<(HTMLElement | null)[]>([]);
  const textoRef = useRef<HTMLDivElement>(null);
  const obras = [POR_CLAVE.get(par.a)!, POR_CLAVE.get(par.b)!];

  useEffect(() => {
    let pAnterior = -1;
    return enCadaFotograma(() => {
      const raiz = raizRef.current;
      if (!raiz) return;
      const {p, visible} = progresoFijado(raiz);
      if (!visible || Math.abs(p - pAnterior) < 0.00005) return;
      pAnterior = p;
      const e = easeOutCubic(tramo(p, 0, 0.4));
      ladoRefs.current.forEach((el, k) => {
        if (!el) return;
        const signo = k === 0 ? -1 : 1;
        el.style.transform = `translate3d(${signo * (1 - e) * 38}vw, 0, 0) rotate(${signo * (1 - e) * 4}deg)`;
      });
      const t = easeOutCubic(tramo(p, 0.15, 0.4));
      textoRef.current!.style.opacity = String(t);
      textoRef.current!.style.transform = `translate3d(0, ${(1 - t) * 3}vh, 0)`;
    });
  }, []);

  return (
    <section ref={raizRef} aria-label={par.pregunta} className="relative" style={{height: '220svh'}}>
      <div className="sticky top-0 grid h-pantalla grid-rows-[auto_minmax(0,1fr)] overflow-hidden px-4 pt-[5svh] pb-[4svh] sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)] md:grid-rows-1 md:items-center md:gap-[3vw] md:px-[4vw] md:py-0">
        <div ref={textoRef} className="text-center md:col-start-2 md:row-start-1" style={{opacity: 0}}>
          <p className="etiqueta text-tinta-3">
            {n} / {sala.pares.length}
          </p>
          <h3 className="ancho-estrecho mt-2 font-display text-[clamp(1.75rem,3.6vw,3.25rem)] leading-[1.02] font-extrabold uppercase">{par.pregunta}</h3>
          <p className="mx-auto mt-3 max-w-[26rem] font-cartela text-body text-tinta-2">{par.texto}</p>
        </div>
        <div className="mt-4 grid min-h-0 grid-cols-2 gap-3 md:contents">
          {obras.map((o, k) => (
            <Lado
              key={o.clave}
              obra={o}
              ref={(el) => {
                ladoRefs.current[k] = el;
              }}
              className={k === 0 ? 'md:col-start-1 md:row-start-1' : 'md:col-start-3 md:row-start-1'}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Lado({obra: o, className, ref}: {obra: Obra; className: string; ref: (el: HTMLElement | null) => void}) {
  return (
    <figure ref={ref} className={`flex h-full min-h-0 flex-col md:h-[78svh] ${className}`}>
      <div className="flex min-h-0 flex-1 items-start justify-center md:items-center">
        <img src={medianaUrl(o.clave)} alt={o.titulo} loading="lazy" decoding="async" className="colgada max-h-full max-w-full object-contain" />
      </div>
      <figcaption className="mt-3 border-l-2 border-tinta pl-3 text-[0.8125rem] md:text-[0.875rem]">
        <span className="block font-semibold">{firma(o)}</span>
        <span className="line-clamp-2 font-cartela italic">{o.titulo}</span>
        <span className="block text-tinta-3">
          {o.fecha || anioLegible(o.anio)} ·{' '}
          <a href={o.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-cobalto">
            {MUSEOS[o.museo]}
          </a>
        </span>
      </figcaption>
    </figure>
  );
}

export function Sala() {
  const ref = useAparecer<HTMLDivElement>();
  return (
    <div id="sala" className="bg-pared">
      <div ref={ref} className="mx-auto max-w-[80rem] px-4 pt-[16svh] pb-[4svh] sm:px-6 md:px-[4vw]">
        <p data-aparece className="etiqueta text-cobalto">
          {sala.antetitulo}
        </p>
        <h2 data-aparece style={{'--i': 1} as React.CSSProperties} className="ancho-estrecho mt-1 font-display text-display font-extrabold uppercase">
          {sala.titulo}
        </h2>
        <p data-aparece style={{'--i': 2} as React.CSSProperties} className="mt-3 max-w-[34rem] text-lead text-tinta-2">
          {sala.cuerpo}
        </p>
      </div>
      {sala.pares.map((par, k) => (
        <Par key={par.a} par={par} n={k + 1} />
      ))}
    </div>
  );
}
