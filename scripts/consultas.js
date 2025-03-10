//En aquest fitxer es mostren les consultes fetes a la base de dades per resoldre els diferents apartats de la pràctica

//TAREAS OBLIGATORIAS (4 puntos)

//1 - Diseño del esquema de la base de datos

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

//Consulta 3: JSON Schema de restaurantes

db.createCollection("restaurants", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "name", "address"],
      properties: {
        _id: {
          bsonType: "objectId",
          description: "Identificador único del restaurante."
        },
        name: {
          bsonType: "string",
          minLength: 1,
          description: "Nombre del restaurante."
        },
        address: {
          bsonType: "string",
          minLength: 1,
          description: "Dirección principal del restaurante."
        },
        outcode: {
          bsonType: "string",
          pattern: "^[A-Z0-9]+$",
          description: "Código postal externo, solo letras y números."
        },
        postcode: {
          bsonType: "string",
          pattern: "^[A-Z0-9]+$",
          description: "Código postal interno del restaurante, solo letras y números."
        },
        type_of_food: {
          bsonType: "string",
          minLength: 1,
          description: "Tipo de comida del restaurante."
        },
        URL: {
          bsonType: "string",
          pattern: "^https?:\\/\\/.+$",
          description: "URL del menú del restaurante."
        }
      }
    }
  }
});

//Consulta 4: JSON Schema de inspecciones

db.createCollection("inspections", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "id", "certificate_number", "business_name", "date", "result", "address", "restaurant_id"],
      properties: {
        _id: {
          bsonType: "objectId",
          description: "Identificador único de la inspección."
        },
        id: {
          bsonType: "string",
          pattern: "^\\d{3,}-\\d{4}-[A-Z]+$",
          description: "Identificador de la inspección con formato."
        },
        certificate_number: {
          bsonType: "int",
          description: "Número de certificado de la inspección, debe ser un entero positivo."
        },
        business_name: {
          bsonType: "string",
          minLength: 1,
          description: "Nombre del negocio inspeccionado."
        },
        date: {
          bsonType: "string",
          pattern: "^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s\\d{2}\\s\\d{4}$",
          description: "Fecha de la inspección en formato 'MMM DD YYYY'."
        },
        result: {
          bsonType: "string",
          description: "Resultado de la inspección."
        },
        address: {
          bsonType: "object",
          required: ["city", "zip", "street"],
          properties: {
            city: {
              bsonType: "string",
              minLength: 1,
            },
            zip: {
              bsonType: "string",
              pattern: "^[A-Z0-9]+$",
            },
            street: {
              bsonType: "string",
              minLength: 1,
            },
            number: {
              bsonType: "string",
            }
          }
        },
        restaurant_id: {
          bsonType: "objectId",
          description: "Referencia al ID del restaurante inspeccionado."
        }
      }
    }
  }
});

//2 - Implementación de consultas en MongoDB

//Consulta 5...

//3 - Uso de agregaciones


//TAREAS AVANZADAS

//1 - Optimización del rendimiento

//2 - Estrategias de escalabilidad