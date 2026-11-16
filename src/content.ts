/** Todo el texto de la página vive aquí. Los componentes no llevan texto suelto. */
import datos from './datos/obras.json';
import portadaDatos from './datos/portada.json';

export type Familia = 'rojos' | 'tierras' | 'amarillos' | 'verdes' | 'azules' | 'violetas' | 'grises';

export type Obra = {
  museo: 'met' | 'cma';
  clave: string;
  titulo: string;
  autor: string;
  cultura: string;
  fecha: string;
  anio: number;
  url: string;
  w: number;
  h: number;
  color: {familia: Familia; rgb: number[]};
};

const base = import.meta.env.BASE_URL;
export const OBRAS = datos.obras as Obra[];
export const POR_CLAVE = new Map(OBRAS.map((o) => [o.clave, o]));
export const RUEDA = (datos.rueda as string[]).map((c) => POR_CLAVE.get(c)!);
export const FAMILIAS = datos.familias as Record<Familia, number>;
export const LINEA = (datos.linea as string[]).map((c) => POR_CLAVE.get(c)!).sort((a, b) => a.anio - b.anio);
export const PORTADA = portadaDatos;
export const miniUrl = (clave: string) => `${base}obras/m/${clave}.webp`;
export const medianaUrl = (clave: string) => `${base}obras/g/${clave}.webp`;
export const grandeUrl = (nombre: string) => `${base}obras/${nombre}.webp`;
export const MUSEOS = {met: 'The Met', cma: 'Cleveland Museum of Art'} as const;

/** Año legible: −2600 → «2600 a. C.». */
export const anioLegible = (a: number) => (a < 0 ? `${-a} a. C.` : String(a));
/** Autor o, si no hay, cultura; si tampoco, el museo. */
export const firma = (o: Obra) => o.autor || o.cultura || MUSEOS[o.museo];

export const portada = {
  invitacion: 'Desliza para alejarte',
  capitulos: [
    {desde: 0.02, hasta: 0.16, texto: 'Esto es una nube.'},
    {desde: 0.18, hasta: 0.34, texto: 'Pintura al óleo puesta tan gruesa que hace relieve. Cada curva es una pincelada de Vincent van Gogh.'},
    {desde: 0.5, hasta: 0.66, texto: 'Y esto, una pared con muchas más obras que ya no tienen dueño.'},
  ],
  cartela: {
    autor: 'Vincent van Gogh',
    titulo: 'Campo de trigo con cipreses',
    fecha: '1889 · Óleo sobre lienzo',
    lugar: 'The Metropolitan Museum of Art, Nueva York',
    nota: 'Lo pintó en junio de 1889, en el sanatorio de Saint-Rémy, y lo consideraba uno de sus mejores cuadros de verano.',
    url: 'https://www.metmuseum.org/art/collection/search/436535',
  },
  antetitulo: 'Obras de dominio público · CC0',
  titulo: 'Museo infinito',
  bajada: (n: number) => `${n} obras de dos museos que cualquiera puede descargar, usar y remezclar sin pedir permiso. Del trazo a la sala.`,
  etiqueta: 'Detalle de pinceladas de Campo de trigo con cipreses, de Van Gogh, que se aleja hasta el cuadro entero y luego hasta una pared llena de obras',
};

export const intro = {
  antetitulo: 'Qué es esto',
  titulo: 'Un museo sin paredes ni horario',
  cuerpo: [
    'The Met publica desde 2017 las imágenes de sus obras de dominio público con licencia CC0: sin derechos reservados, ni siquiera la atribución. El Cleveland Museum of Art hace lo mismo desde 2019, con más de 41.000 obras con imagen.',
    'Las dos colecciones tienen una API abierta. Esta página está hecha con ellas: cada obra trae su ficha, su fecha y un enlace a la página del museo. El color dominante lo hemos calculado a partir de cada imagen.',
  ],
  cifras: (n: number, met: number, cma: number) => [
    {valor: String(n), texto: 'obras en esta página'},
    {valor: String(met), texto: 'de The Met'},
    {valor: String(cma), texto: 'del Cleveland Museum of Art'},
  ],
};

export const rueda = {
  antetitulo: 'Por colores',
  titulo: 'El color del museo',
  cuerpo: 'Las obras de esta página, en fila por el tono que más pesa en su foto, dan la vuelta a un círculo. Desliza para recorrerlo o salta a una familia.',
  aviso: 'Color calculado sobre la foto de cada obra: la luz y el fondo de la foto también cuentan.',
  de: (n: number, total: number) => `${n} de ${total} obras · ${Math.round((n / total) * 100)} %`,
  botones: 'Saltar a una familia de color',
  familias: {
    rojos: {nombre: 'Rojos', texto: 'Lacas, bermellón, tejidos teñidos y cerámica vidriada.'},
    tierras: {
      nombre: 'Tierras',
      texto: 'Dos de cada tres obras caen aquí: bronce, madera, terracota, papel envejecido y óleos con el barniz amarilleado. Los pigmentos de tierra eran baratos y aguantan bien el paso del tiempo.',
    },
    amarillos: {nombre: 'Amarillos', texto: 'Oro, seda y algún amarillo de plomo y estaño. Pocos sobreviven tan vivos como se pintaron.'},
    verdes: {nombre: 'Verdes', texto: 'Casi no hay. Muchos verdes antiguos, como el verdigrís, se han oscurecido hasta parecer marrones.'},
    azules: {nombre: 'Azules', texto: 'Escasos y caros: el ultramar se molía a partir de lapislázuli traído de Afganistán y llegó a valer tanto como el oro.'},
    violetas: {nombre: 'Violetas', texto: 'Casi inexistentes. El púrpura era un tinte de lujo y no hubo pigmentos violetas estables hasta el siglo XIX.'},
    grises: {nombre: 'Grises y blancos', texto: 'Mármol, plata, piedra, porcelana, grabados en blanco y negro y las primeras fotografías.'},
  } as Record<Familia, {nombre: string; texto: string}>,
};

export const linea = {
  antetitulo: 'Por fechas',
  titulo: '5.000 años en una línea',
  cuerpo: 'Desde Mesopotamia y Egipto hasta los años veinte. Desliza y el tiempo pasa.',
  escala: 'La misma línea a escala real',
  hoy: 'Las obras más recientes de la línea están en dominio público porque sus autores murieron hace más de 70 años o porque se publicaron antes de 1931.',
};

export const sala = {
  antetitulo: 'Dos museos, una misma pregunta',
  titulo: 'La sala de comparación',
  cuerpo: 'Una obra de cada museo, frente a frente. Siglos y continentes de distancia, el mismo problema.',
  pares: [
    {
      pregunta: '¿Cómo se representa a una madre?',
      a: 'cma-143165',
      b: 'met-437175',
      texto: 'Un tapiz de lana tejido en Egipto en el siglo VI y un óleo sevillano de hacia 1670. En el primero, la Virgen está en un trono, de frente; en el segundo, ya solo mira al niño.',
    },
    {
      pregunta: '¿Cómo se pinta con poca luz?',
      a: 'met-50360',
      b: 'cma-148774',
      texto: 'El bodisatva de la luna en el agua, en un rollo de seda coreano del siglo XIV, y las cataratas del Niágara de noche, dibujadas por Frederic Church con grafito y blanco hacia 1856.',
    },
    {
      pregunta: '¿Qué cara se pone uno para que lo miren?',
      a: 'met-547257',
      b: 'cma-126730',
      texto: 'Una máscara funeraria de una mujer egipcia del siglo I, de cartonaje y yeso, y una de madera lacada para el gigaku, el teatro danzado que llegó a Japón en el siglo VII. Una es para el más allá; la otra, para la procesión.',
    },
    {
      pregunta: '¿Cómo se dibuja una montaña?',
      a: 'cma-90249',
      b: 'met-359882',
      texto: 'Un pintor coreano anónimo envuelve las montañas en niebla con tinta sobre seda, hacia 1500. Un siglo después, Hercules Segers graba en Holanda montañas que probablemente nunca vio y las imprime en verde azulado.',
    },
  ] as {pregunta: string; a: string; b: string; texto: string}[],
};

export const creditos = {
  antetitulo: 'Fuentes',
  titulo: 'Cómo está hecha',
  cuerpo:
    'Datos e imágenes de la Open Access API de The Metropolitan Museum of Art y de la Open Access API del Cleveland Museum of Art. Solo obras destacadas por cada museo, marcadas como dominio público o CC0. Las imágenes se han reducido y convertido a WebP; el color dominante y la selección son nuestros. Ningún museo patrocina ni revisa esta página.',
  fuentes: [
    {texto: 'The Met Open Access', url: 'https://www.metmuseum.org/hubs/open-access'},
    {texto: 'Cleveland Museum of Art Open Access', url: 'https://www.clevelandart.org/open-access'},
    {texto: 'Archivo y Source Serif 4 (SIL OFL)', url: 'https://fonts.google.com/'},
  ],
  volver: 'Volver arriba',
  wordmark: 'Museo infinito',
  firma: 'Textos y código hechos con IA (Claude) y revisados, como pieza de portfolio.',
};
