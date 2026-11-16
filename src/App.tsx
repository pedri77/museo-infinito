import {useEffect} from 'react';
import {Creditos} from './components/Creditos';
import {Intro} from './components/Intro';
import {Linea} from './components/Linea';
import {Portada} from './components/Portada';
import {Rueda} from './components/Rueda';
import {Sala} from './components/Sala';
import {useMovimientoReducido} from './hooks/useMovimientoReducido';
import {iniciarScroll} from './lib/scroll';

/** Orden del guion: del trazo a la sala · qué es esto · rueda de color · línea del tiempo · sala de comparación · fuentes. */
export default function App() {
  const reducido = useMovimientoReducido();
  useEffect(() => iniciarScroll(reducido), [reducido]);
  return (
    <main>
      <Portada />
      <Intro />
      <Rueda />
      <Linea />
      <Sala />
      <Creditos />
    </main>
  );
}
