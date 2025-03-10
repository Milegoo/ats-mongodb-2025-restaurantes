//En aquest fitxer es mostren les consultes fetes a la base de dades per resoldre els diferents apartats de la pràctica

//TAREAS OBLIGATORIAS (4 puntos)

//1: Diseño del esquema de la base de datos

//Consulta 1: Media de inspecciones por restaurante

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

//Consulta 2: 5 restaurantes con mayor número de inspecciones

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
      "$limit": 1
    }
  ])


