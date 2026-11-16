import {OBRAS, intro} from '../content';
import {useAparecer} from '../hooks/useAparecer';

/** Qué es esto: CC0 y Open Access en dos párrafos, con las cifras de la página. */
export function Intro() {
  const ref = useAparecer<HTMLElement>();
  const met = OBRAS.filter((o) => o.museo === 'met').length;
  return (
    <section ref={ref} aria-labelledby="intro-titulo" className="bg-pared py-[16svh]">
      <div className="mx-auto grid max-w-[80rem] gap-10 px-4 sm:px-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-[6vw] md:px-[4vw]">
        <div>
          <p data-aparece className="etiqueta text-cobalto">
            {intro.antetitulo}
          </p>
          <h2 id="intro-titulo" data-aparece style={{'--i': 1} as React.CSSProperties} className="ancho-estrecho mt-1 font-display text-display font-extrabold uppercase">
            {intro.titulo}
          </h2>
        </div>
        <div>
          {intro.cuerpo.map((t, k) => (
            <p key={k} data-aparece style={{'--i': k + 2} as React.CSSProperties} className="mt-4 first:mt-0 font-cartela text-lead text-tinta-2">
              {t}
            </p>
          ))}
          <dl className="mt-10 grid grid-cols-3 border-t border-tinta">
            {intro.cifras(OBRAS.length, met, OBRAS.length - met).map((c, k) => (
              <div key={c.texto} data-aparece style={{'--i': k + 4} as React.CSSProperties} className="border-r border-linea pt-3 pr-3 last:border-r-0 [&:not(:first-child)]:pl-3">
                <dt className="sr-only">{c.texto}</dt>
                <dd className="ancho-estrecho font-display text-[clamp(2.25rem,5vw,4rem)] leading-none font-extrabold tabular-nums">{c.valor}</dd>
                <dd className="mt-1 text-[0.8125rem] text-tinta-3">{c.texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
