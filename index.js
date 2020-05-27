/**
 * Se usa moment-timezone para cambiar los datos temporales a nuestra zona horaria
 */
const moment = require('moment-timezone');
const data = require('./rain.json');

/**
 * Se indica que por defecto la zona horaria a usar será la de América/Bogotá
 * (los datos fueron almacenados usando UTC)
 */
moment.tz.setDefault('America/Bogota');

/**
 * Función principal para el procesamiento de los datos
 * @param {numeric} minMeausre indica la medida mínima a tener en cuenta
 * @param {boolean} ignoreManual indica si se tienen o no en cuenta los datos agregados manualmente
 * @param {boolean} showResults mostrar los datos dentro del arreglo en formato CSV
 */
const main = (minMeasure = 0, ignoreManual = true, showResults = false) => {
  // arreglo con los datos resultantes
  const result = [];
  
  // variable para guardar el promedio
  let prom = 0;

  /*
  usamos estas variables para determinar la hora inicial y final del calculo que
  estamos realizando y determinar el tiempo medido (revisar condicional if dentro del ciclo)
  */
  let first, last;

  // ciclo para procesar los datos obtenidos
  data.updates.forEach(({ rainfall, time, manual }) => {
    // comprobamos si se tiene en cuenta o no los datos agregados "manualmente" para el cálculo
    if (ignoreManual && manual) {
      return;
    }
    // convertimos la variable rainfall (viene como cadena) en un número flotante
    const n = parseFloat(rainfall);

    /*
    Si queremos obtener un promedio a partir de los datos obtenidos superiores a un valor
    en particular (debido a que exite un periodo de tiempo extendido sin datos, si tomamos
    únicamente los valores de los extremos y promediamos los demás, el promedio se reduce
    demasiado arrojando un dato menos exacto del que evidenciamos el día de ayer).
    */
    if (n > minMeasure) {
      // usamos esta variable para almacenar la cadena formateada con la hora y minutos del dato
      const t = moment(time).format('hh:mm A');

      // si la variable first no ha sido definida, la definimos con el primer dato del diclo
      if (!first) {
        first = moment(time);
      }

      /*
      la variable last es redefinida en cada iteración hasta quedar con el último valor
      (Si! está feo, podría utilizar directamente el último valor fuera del ciclo).
      */
      last = moment(time);

      // se suma cada valor en cada iteración a la variable para cálcular el promedio
      prom += n;

      // se agrega una concatenación de la hora y el valor obtenido al arreglo de cadenas resultante
      result.push(`${n};${t}`);
    }
  });

  if (showResults) {
    /*
    se imprime el arreglo de cadenas resultante
    (lo usamos para generar texto en CSV que podamos pegar en excel)
    */
    console.log(result.join('\n'));
  }

  // se calcula finalmente el promedio dividiendo la suma de datos entre la cantidad de datos procesados
  prom = prom / result.length;

  // se obtiene la cantidad de minutos de diferencia entre el dato inicial y el dato final
  const diff = first.diff(last, 'minutes');

  // se muestra la cantidad de minutos usados en la muestra para el cálculo
  console.log(`Minutos lluvia: ${diff}`);

  // se muestra la el promedio de mm/h que se obtuvo en el cálculo
  console.log(`Promedio: ${prom.toFixed(2)} mm/h`);

  /*
  se calcula y muestra la cantidad de milimetros de lluvia, tomando el promedio de mm/h,
  luego se convierte esa cantidad a minutos, para multiplicarlo por los minutos que llovió
  */
  const mm = (prom/60)*diff;
  console.log(`Milimetros: ${mm.toFixed(2)}`);

  // se muestra el mismo datos convertido a litros por metro cuadrado
  console.log(`Litros por metro cuadrado: ${mm.toFixed(2)}`);
};


/**
 * Función para rellenar los datos faltantes de medición.
 * Se crea una linea descendente entre el dato más alto y el más bajo
 * en una linea de tiempo por segmentos de 4 minutos (rango promedio aprox de las mediciones previas)
 */
const fill = () => {
  // último dato hasta la pérdida de conexión
  const initial = {
    rainfall: 26.6,
    time: '2020-05-26T22:30:14.501Z',
  };
  // primer dato cuando se reanuda la conexión
  const final = {
    rainfall: 29.06,
    time: '2020-05-26T23:30:14.501Z',
  };

  // se crean instancias del objeto moment para procesar fechas
  const initialTime = moment(initial.time);
  const finalTime = moment(final.time);

  // se obtiene la cantidad de minutos de diferencia entre ambos momentos
  const timeDifference = finalTime.diff(initialTime, 'minutes');

  // se define la constante para los segmentos de tiempo
  const minutesAdd = 4;

  /*
  se calcula la cantidad de intervalos de tiempo de acuerdo al segmento definido
  (se le resta uno para que la última iteración no se solape con el dato que ya existe)
  */
  const iterations = (timeDifference / minutesAdd) - 1;

  // se calcula la diferencia de mm/h que debe agregarse en cada iteración para crear la linea
  const difference = (final.rainfall - initial.rainfall) / iterations;

  // se define una variable que tenga la cantidad actual
  let currentRainfall = initial.rainfall;

  // se define un arreglo para los resultados
  const result = [];

  // se inicia el ciclo
  for(let i = 0; i < iterations; i += 1) {

    // se agrega el segmento de tiempo al momento inicial para servir de acumulador de tiempo
    initialTime.add(minutesAdd, 'minutes');

    // se agrega la diferencia que debe ser agregado al valor actual de lluvia
    currentRainfall += difference;

    // se cargan los resultados en el arreglo
    result.push({
      rainfall: currentRainfall.toFixed(2),
      time: initialTime.toISOString(),
      // se indica que este dato se creo "manualmente"
      manual: true,
    });
  }

  // se imprime el resultado en formato JSON
  console.log(JSON.stringify(result.reverse()));
};

console.log('===================================');
console.log('TODOS LOS DATOS SIN DATOS MANUALES');

// procesar todos los datos sin incluir datos manuales
main();

console.log('==========================================================');
console.log('LOS DATOS CON MEDIDAS DE MÁS DE 10 MM/H SIN DATOS MANUALES');

// procesar únicamente las medidas mayores de 10 mm/h sin incluir los datos manuales
main(10);

console.log('=========================================');
console.log('TODOS LOS DATOS INCLUYENDO DATOS MANUALES');

// procesar todos los datos incluyendo los datos manuales
main(0, false);

console.log('=================================================================');
console.log('LOS DATOS CON MEDIDAS DE MÁS DE 10 MM/H INCLUYENDO DATOS MANUALES');

// procesar únicamente las medidas mayores de 10 mm/h incluyendo los datos manuales
main(10, false);

// fill();
