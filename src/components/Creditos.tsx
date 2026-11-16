import {creditos} from '../content';
import {useAjustarTexto} from '../hooks/useAjustarTexto';
import {useAparecer} from '../hooks/useAparecer';
import {irA} from '../lib/scroll';

/** Fuentes, licencias y el nombre de la página de borde a borde. */
export function Creditos() {
  const ref = useAparecer<HTMLElement>();
  const marca = useAjustarTexto<HTMLSpanElement>();
  return (
    <footer ref={ref} aria-labelledby="creditos-titulo" className="border-t border-tinta bg-pared pt-[12svh]">
      <div className="mx-auto grid max-w-[80rem] gap-10 px-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:px-[4vw]">
        <div>
          <p data-aparece className="etiqueta text-cobalto">
            {creditos.antetitulo}
          </p>
          <h2 id="creditos-titulo" data-aparece style={{'--i': 1} as React.CSSProperties} className="ancho-estrecho mt-1 font-display text-display font-extrabold uppercase">
            {creditos.titulo}
          </h2>
          <button
            type="button"
            onClick={() => irA('#inicio')}
            data-aparece
            style={{'--i': 2} as React.CSSProperties}
            className="mt-8 border-2 border-tinta px-5 py-2.5 text-[0.9375rem] font-semibold transition-colors hover:bg-tinta hover:text-pared"
          >
            ↑ {creditos.volver}
          </button>
        </div>
        <div>
          <p data-aparece style={{'--i': 2} as React.CSSProperties} className="font-cartela text-lead text-tinta-2">
            {creditos.cuerpo}
          </p>
          <ul className="mt-6 grid gap-2">
            {creditos.fuentes.map((f) => (
              <li key={f.url}>
                <a href={f.url} target="_blank" rel="noreferrer" className="text-cobalto underline underline-offset-4">
                  {f.texto} ↗
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[0.8125rem] text-tinta-3">{creditos.firma}</p>
        </div>
      </div>
      <div className="mt-[10svh] overflow-hidden px-4 pb-4 sm:px-6 md:px-[4vw]" aria-hidden="true">
        <span ref={marca} className="ancho-estrecho inline-block font-display leading-[0.9] font-extrabold tracking-[-0.03em] whitespace-nowrap uppercase">
          {creditos.wordmark}
        </span>
      </div>
    </footer>
  );
}
