# Informe Práctica MongoDB

*Autores: Eloi Milego (1633753) y Raul Villar*

## 1. Diseño del esquema de la base de datos

Primero de todo, hemos analizado las dos colecciones y hemos visto que una inspección está asociada a un restaurante, mientras que un restaurante puede tener varias inspecciones. Para determinar si la relación era one-to-few o one-to-many, hemos realizado algunas consultas.

La primera consulta ha sido para ver la media de inspecciones por restaurante. Se trata de la consulta 1 que se encuentra en el archivo de consultas ([consultas.js](../scripts/consultas.js))


```javascript
db.inspections.aggregate([
    {
      "$group": {
        "_id": "$restaurant_id",
        "count": { "$sum": 1 }
      }
    },
    {
      "$group": {
        "_id": null,
        "avg_inspections": { "$avg": "$count" }
      }
    }
  ])
```
El resultado obtenido en la consulta ha sido el siguiente:

![Resultado consulta 1](image.png)

Como podemos ver la media es de menos de 3 inspecciones  por restaurante lo que podria indicar un esquema one-to-few pero para asegurarlo vamos a mirar los restaurantes con más cantidad de inspecciones, por si en algun caso algun restaurante tuviera muchas.

Para ello hacemos una consulta que calcula la máxima cantidad de inspecciones que llega a tener un restaurante actualmente. Se trata de la consulta 2 que se encuentra en el archivo de consultas ([consultas.js](../scripts/consultas.js))

El resultado obtenido es el siguiente:

![Resultado consulta 2](image-1.png)

Hemos valorado la posibilidad de usar embeddings en lugar de referencias. Es decir, crear una nueva collection de restaurantes donde cada restaurante tenga un array de inspecciones con la información de cada inspección que se le ha realizado. Es una buena opción, teniendo en cuenta que cada restaurante por ahora tiene pocas inspecciones. Además usar embeddings podría ofrecer una accesibilidad más rápida y en una única consulta a las inspecciones de un restaurante concreto.

Sin embargo, hemos decidido quedarnos con el uso de referencias con el campo restaurant_id que refrencia el restaurante al que se le ha realizado una inspección concreta. El motivo de esta elección es que en un futuro puede ser que los restaurantes empiecen a recibir muchas más inspecciones (en principio se hacen inspecciones anuales) con lo que si usaramos embeddings el documento podría crecer mucho y tener peor rendimiento. Además si se quieren realizar consultas sobre las inspecciones de todos los restaurantes en caso de usar embeddings se debería acceder al documento entero lo cual es poco óptimo.

Para validar ambas colecciones se ha realizado un JSON Schema por cada colección. 
Los json schema son las consultas 3 y 4 del fichero de consultas ([consultas.js](../scripts/consultas.js))

Para la coleccion de restaurantes (consulta 3) el esquema asegura lo siguiente:
- _id (required) debe ser un ObjectId. Así evitamos que se generen ids que no sean un ObjectId y que todos los restaurantes tengan un id asociado.
- name (required) debe ser una cadena con al menos 1 carácter. Así evitamos que haya documentos de restaurantes sin nombre o con nombre vacío.
- address (required) debe ser una cadena con al menos 1 carácter. Así evitamos que haya documentos de restaurantes sin dirección o dirección vacía.
- outcode (opcional) no lo hemos considerado obligatorio porque quizás hay algun restaurante que con la dirección ya es suficiente. También comprobamos que sea alfanumérico.
- postcode (opcional) tampoco lo hemos considerado obligatorio por el mismo motivo. También comprobamos que sea alfanumérico.
- type_of_food (opcional) no lo consideramos obligatorio ya que puede haber restaurantes con mucha variedad. Aseguramos que en caso de que un documento tenga ese campo no esté vacío y tenga por lo menos un carácter.
- URL (opcional) debe ser una cadena que comience con http o https seguido de :// para evitar links fraudulentos. No es obligatorio ya que hay restaurantes sin web.

Para la coleccion de inspecciones (consulta 4) el esquema asegura lo siguiente:
- _id (required) debe ser un ObjectId. Es obligatorio para poder identificar cada inspección.
- id (required) debe ser una cadena. Es obligatorio ya que además de identificar como ObjectID cada inspección debe tener un id.
- certificate_number (required) debe ser un número entero positivo. Es obligatorio que la inspección esté certificada.
- business_name (required) debe ser una cadena con al menos 1 carácter. Es obligatorio indicar el nombre del restaurante.
- date (required) debe ser una cadena en el formato MMM DD YYYY (ej. Jan 15 2024). Requerimos este campo porque toda inspeccion tiene una fecha y indicamos este formato para poder consultar sobre las fechas de las inspecciones sin problemas.
- result (required) debe ser una cadena de texto. Toda inspección debe tener un resultado.
- address (required) es obligatorio ya que toda inspección se hace en algun sitio y debe ser un objeto que contenga:
  - city (required): una cadena con al menos 1 carácter obligatoria.
  - zip (required): una cadena con solo letras y números obligatoria.
  - street (required): una cadena con al menos 1 carácter obligatoria.
  - number (opcional): una cadena opcional ya que no siempre una dirección tiene número.
- restaurant_id (required) debe ser un ObjectId que referencia a un restaurante. Obligatorio ya que es la referencia con la colección de restaurantes.


## 2. Implementación de consultas en MongoDB

- Buscar todos los restaurantes de un tipo de comida específico (ej. "Chinese").
- Listar las inspecciones con violaciones, ordenadas por fecha.
- Encontrar restaurantes con una calificación superior a 4.

## 3. Uso de agregaciones

En este apartado se realizan 3 consultas utilizando agregaciones de MongoDB.

Las 3 consultas se encuentran en el fichero de consultas ([consultas.js](../scripts/consultas.js)) en el apartado 3 - Uso de agregaciones.

CONSULTA X - Obtener el número de inspecciones por restaurante.

Para esta consulta se ha usado $match para excluir los restaurantes con valor en el campo rating de "Not rated yet".
Después hemos agrupado con $group con el tipo de comida (type_of_food) como _id y hemos calculado la media del rating para cada tipo.
Para calcular la media con $avg hemos convertido a double el campo rating que era un string.
Por último hemos ordenado por la media de puntuación de cada tipo de comida.

CONSULTA Y - Calcular el porcentaje de cada resultado de inspección.

En esta consulta hemos agrupado con $group para contar cuántas inspecciones hay por cada resultado (result).
Después, hemos vuelto a agrupar para calcular el total de inspecciones y almacenar los resultados en un array.
Con $unwind, descomponemos el array y calculamos el porcentaje de cada resultado con $divide para el tanto por 1 y multiplicando con $multiply para el porcentaje.
Por último, ordenamos por porcentaje en orden descendente.

CONSULTA Z - Unir restaurantes con sus inspecciones usando $lookup.

En esta consulta hemos utilizado $lookup para unir los restaurantes con la colección de inspecciones.
La unión se hace entre el campo _id de la colección restaurants y el campo restaurant_id de inspections.
El resultado se almacena en un nuevo campo llamado inspection_history, que contiene un array con las inspecciones de cada restaurante.

## 4. Optimización del rendimiento

Para la optimización del rendimiento lo primero que se ha hecho ha sido identificar para nuestro caso de uso "Analisis de tendencias en inspecciones del sector de la restauración" las consultas más comunes y se han implementado índices adecuados es base a ellos.

Las consulta e índices creados se encuentran en el apartado 4 - Optimización de rendimiento en el fichero de consultas ([consultas.js](../scripts/consultas.js))
El índice además de para la consulta de ejemplo puede ser útil para otras consultas con el mismo campo.

### CONSULTA 1 - Agrupar inspecciones por resultado

Consideramos que agrupar las consultas según su resultado es algo que puede ser bastante común a la hora de querer realizar estadísticas y analizar las inspecciones de un grupo de restaurantes, de un restaurante concreto o de todos los restaurantes.

Rendimiento antes de crear el índice:
  - stage: COLLSCAN 
  - nReturned: 1280
  - totalKeysExamined: 0,
  - totalDocsExamined: 6370,


Rendimiento después de crear el índice:
  - stage: IXSCAN
  - nReturned: 1280
  - totalKeysExamined: 1280,
  - totalDocsExamined: 1280,
  - keyPattern: {
      result: 1
    },

### CONSULTA 2 - Encontrar inspecciones de un restaurante en concreto

Será una consulta muy común querer encontrar todas las inspecciones de un restaurante específico.

Rendimiento antes de crear el índice:
  - stage: COLLSCAN 
  - nReturned: 3
  - totalKeysExamined: 0,
  - totalDocsExamined: 6370,

Rendimiento después de crear el índice:
  - stage: IXSCAN
  - nReturned: 3
  - totalKeysExamined: 3,
  - totalDocsExamined: 3,
  - keyPattern: {
      restaurant_id: 1
    },

### CONSULTA 3 - Encontrar todas las inspecciones de una ciudad específica

Será una consulta muy común querer encontrar todas las inspecciones por ciudad ya que permitirá estudiar la diferencia entre zonas geográficas.

Rendimiento antes de crear el índice:
  - stage: COLLSCAN 
  - nReturned: 37,
  - totalKeysExamined: 0,
  - totalDocsExamined: 6370,

Rendimiento después de crear el índice:
  - stage: IXSCAN
  - nReturned: 37
  - totalKeysExamined: 37,
  - totalDocsExamined: 37,
  - keyPattern: {
      'address.city': 1
    },

### CONSULTA 4 - Encontrar todas las inspecciones con una fecha específica

Puede ser muy común querer filtrar por la fecha de inspección para analizar las inspecciones en el tiempo.

Rendimiento antes de crear el índice:
  - stage: COLLSCAN 
  - nReturned: 5,
  - totalKeysExamined: 0,
  - totalDocsExamined: 6370,

Rendimiento después de crear el índice:
  - stage: IXSCAN
  - nReturned: 5
  - totalKeysExamined: 5,
  - totalDocsExamined: 5,
  - keyPattern: {
      date: 1
    },

Como hemos podido ver en estas 4 consultas comunes para nuestro caso de uso de analisis de las inspecciones, el uso de índices para ciertos campos usados frecuentemente ofrecen una gran optimización en muchas consultas reduciendo así el número de documentos escaneados y el tiempo de la consulta y ofreciendo un mejor rendimiento global.

## 5. Estrategias de escalabilidad

- Proponer una estrategia de sharding adecuada para este dataset.
- Diseñar un esquema de replicación para alta disponibilidad.
- Analizar posibles cuellos de botella y soluciones.

*El punto 2 es correcto si solo se implementa a nivel teorico justificando las decisiones de diseño*

