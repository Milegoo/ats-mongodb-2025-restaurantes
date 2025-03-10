# Informe Práctica MongoDB

*Autores: Eloi Milego (1633753) y Raul Villar*

## Tareas Obligatorias (Hasta 4 puntos)

Estas tareas deben realizarse obligatoriamente para aprobar la práctica:

### 1. Diseño del esquema de la base de datos

- Analizar la estructura de los datos y determinar el tipo de relación entre restaurantes e inspecciones (One-to-Few, One-to-Many, One-to-Millions).

Primero de todo, hemos analizado las dos colecciones y hemos visto que una inspección está asociada a un restaurante, mientras que un restaurante puede tener varias inspecciones. Para determinar si la relación era one-to-few o one-to-many, hemos realizado algunas consultas.

La primera consulta ha sido para ver la media de inspecciones por restaurante:

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

Como podemos ver la media es de menos de 3 inspecciones de restaurantes lo que podria indicar un esquema one-to-few pero para asegurarlo vamos a mirar los restaurantes con más cantidad de inspecciones, por si en algun caso algun restaurante tuviera muchas.

Para ello hacemos la siguiente consulta:

```javascript
db.inspections.aggregate([
  {
    "$group": {
      "_id": "$restaurant_id",
      "count": { "$sum": 1 }
    }
  },
  {
    "$sort": { "count": -1 }
  },
  {
    "$limit": 5
  }
])
```

El resultado obtenido es el siguiente:

![Resultado consulta 2](image-1.png)

- Justificar la elección de referencias (`restaurant_id`) en lugar de documentos embebidos.
También puedes decidir crear una nueva collection que no utilice las referencias e incorpore los documentos embebidos.

A pesar de que puede ser más cómodo tener una única colección con documentos embedidos ya que la relación es one-to-few y hay pocas inspecciones por restaurante, la elección de usar referencias con el campo restaurant_id que refrencia el restaurante al que se le ha realizado x inspección aporta mayor escalabilidad. Si por algun caso varios restaurante reciben una gran cantidad de inspecciones en el futuro el documento crecería demasiado y no seria eficiente.

- Definir un esquema de validación para ambas colecciones.

Para validar ambas colecciones se ha realizado un JSON Schema por cada colección. 

Para la coleccion de restaurantes el esquema asegura que el campo "_id" sea un ObjectID, que el campo "name" sea un string obligatorio, 

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

