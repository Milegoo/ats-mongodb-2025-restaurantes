# Informe Práctica MongoDB

*Autores: Eloi Milego (1633753) y Raul Villar*

## Tareas Obligatorias (Hasta 4 puntos)

Estas tareas deben realizarse obligatoriamente para aprobar la práctica:

### 1. Diseño del esquema de la base de datos

- Analizar la estructura de los datos y determinar el tipo de relación entre restaurantes e inspecciones (One-to-Few, One-to-Many, One-to-Millions).

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

- Justificar la elección de referencias (`restaurant_id`) en lugar de documentos embebidos.
También puedes decidir crear una nueva collection que no utilice las referencias e incorpore los documentos embebidos.

Hemos valorado la posibilidad de usar embeddings en lugar de referencias. Es decir, crear una nueva collection de restaurantes donde cada restaurante tenga un array de inspecciones con la información de cada inspección que se le ha realizado. Es una buena opción, teniendo en cuenta que cada restaurante por ahora tiene pocas inspecciones. Además usar embeddings podría ofrecer una accesibilidad más rápida y en una única consulta a las inspecciones de un restaurante concreto.

Sin embargo, hemos decidido quedarnos con el uso de referencias con el campo restaurant_id que refrencia el restaurante al que se le ha realizado una inspección concreta. El motivo de esta elección es que en un futuro puede ser que los restaurantes empiecen a recibir muchas más inspecciones (en principio se hacen inspecciones anuales) con lo que si usaramos embeddings el documento podría crecer mucho y tener peor rendimiento. Además si se quieren realizar consultas sobre las inspecciones de todos los restaurantes en caso de usar embeddings se debería acceder al documento entero lo cual es poco óptimo.

- Definir un esquema de validación para ambas colecciones.

Para validar ambas colecciones se ha realizado un JSON Schema por cada colección. 
Los json schema son las consultas 3 y 4 del fichero de consultas ([consultas.js](../scripts/consultas.js))

Para la coleccion de restaurantes (consulta 3) el esquema asegura lo siguiente:
- _id debe ser un ObjectId válido.
- id debe ser una cadena con el formato NNN-NNNN-AAA (ej. 123-2023-ENF).
- certificate_number debe ser un número entero positivo.
- business_name debe ser una cadena con al menos 1 carácter.
- date debe ser una cadena en el formato MMM DD YYYY (ej. Jan 15 2024).
- result debe ser una cadena de texto.
- address debe ser un objeto que contiene:
  - city: una cadena con al menos 1 carácter.
  - zip: una cadena con solo letras y números.
  - street: una cadena con al menos 1 carácter.
  - number: una cadena opcional.
- restaurant_id debe ser un ObjectId válido que referencia a un restaurante.
- todos los campos son requeridos

Para la coleccion de inspecciones (consulta 4) el esquema asegura lo siguiente:
- _id debe ser un ObjectId válido.
- name debe ser una cadena con al menos 1 carácter.
- address debe ser una cadena con al menos 1 carácter.
- outcode (opcional) debe ser una cadena que contenga solo letras y números.
- postcode (opcional) debe ser una cadena que contenga solo letras y números.
- type_of_food (opcional) debe ser una cadena con al menos 1 carácter.
- URL (opcional) debe ser una cadena que comience con http o https seguido de :// 

### 2. Implementación de consultas en MongoDB

- Buscar todos los restaurantes de un tipo de comida específico (ej. "Chinese").
- Listar las inspecciones con violaciones, ordenadas por fecha.
- Encontrar restaurantes con una calificación superior a 4.

### 3. Uso de agregaciones

- Agrupar restaurantes por tipo de comida y calcular la calificación promedio.
- Contar el número de inspecciones por resultado y mostrar los porcentajes.
- Unir restaurantes con sus inspecciones utilizando `$lookup`.

Ejemplo de `$lookup`:

```javascript
db.restaurants.aggregate([
    {
        "$lookup": {
            "from": "inspections",
            "localField": "_id",
            "foreignField": "restaurant_id",
            "as": "inspection_history"
        }
    }
]);
```

## Tareas Avanzadas (Hasta 6 puntos)

Estas tareas son más complejas y exploratorias y por lo tanto más abiertas:

### 1. Optimización del rendimiento

- Identificar las posibles consultas más frecuentes.
- Implementar índices adecuados para esas consultas.
- Comparar el rendimiento antes y después de crear los índices utilizando `explain()`.

### 2. Estrategias de escalabilidad

- Proponer una estrategia de sharding adecuada para este dataset.
- Diseñar un esquema de replicación para alta disponibilidad.
- Analizar posibles cuellos de botella y soluciones.

*El punto 2 es correcto si solo se implementa a nivel teorico justificando las decisiones de diseño*

