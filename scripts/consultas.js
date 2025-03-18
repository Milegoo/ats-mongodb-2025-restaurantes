//En este archivo se muestran las consultas realizadas a la base de datos para resolver los diferentes apartados de la práctica

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
      required: ["_id", "name", "address", "outcode", "postcode"],
      properties: {
        _id: {
          bsonType: "objectId",
          description: "Restaurant identifier."
        },
        name: {
          bsonType: "string",
          minLength: 1,
          description: "Restaurant name."
        },
        address: {
          bsonType: "string",
          minLength: 1,
          description: "Main address of the restaurant."
        },
        outcode: {
          bsonType: "string",
          pattern: "^[A-Z0-9]+$",
          description: "Outcode of the restaurant, only letters and numbers."
        },
        postcode: {
          bsonType: "string",
          pattern: "^[A-Z0-9]+$",
          description: "Postcode of the restaurant, only letters and numbers."
        },
        type_of_food: {
          bsonType: "string",
          minLength: 1,
          description: "Type of food served in the restaurant. (optional)"
        },
        URL: {
          bsonType: "string",
          pattern: "^https?:\\/\\/.+$",
          description: "URL of the restaurant website. (optional)"
        }
      }
    }
  }
});

//Consulta 4: JSON Schema de inspecciones

db.createCollection("inspections", { //rating?
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
          minLength: 1,
          description: "Identificador de la inspección."
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
          minLength: 1,
          description: "Resultado de la inspección."
        },
        address: {
          bsonType: "object",
          required: ["city", "zip"],
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
              minLength: 1,
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

//Consulta 5 - Buscar todos los restaurantes de un tipo de comida específico

var categoria = "Chinese"; // Define la comida deseada

db.restaurants.find({ 
  type_of_food: categoria 
});

//Consulta 6 - Listar las inspecciones con violaciones, ordenadas por fecha.

db.inspections.aggregate([
  {
    $match: {
      result: "Violation Issued"
    }
  },
  {
    $addFields: {
      dateAsDate: {
        $dateFromString: {
          dateString: '$date',
          format: '%b %d %Y'
        }
      }
    }
  },
  {
    $sort: {
      dateAsDate: 1
    }
  },
  {
    $project: {
      dateAsDate: 0  
    }
  }
]);

//Consulta 7 - Encontrar restaurantes con una calificación superior a 4.

db.restaurants.find({
  "rating": { $gt: 4 }
});

//3 - Uso de agregaciones

//Consulta X: Obtener el número de inspecciones por restaurante.

db.restaurants.aggregate([
  {
    $match: {
      rating: { $ne: "Not yet rated" }  // Excluimos los que no tienen rating
    }
  },
  {
    $group: {
      _id: "$type_of_food",
      average_rating: { $avg: { $toDouble: "$rating" } }
    }
  },
  {
    $sort: { average_rating: -1 }
  }
])

//Consulta Y: Calcular la calificación promedio por tipo de comida.

db.inspections.aggregate([
  //Agrupamos por resultado y contamos
  {
    $group: { 
      _id: "$result",
      count: { $sum: 1 } 
    }
  },
  //Calculamos el total y guardamos en un array los resultados del paso anterior
  {
    $group: {
      _id: null,
      results: { $push: { result: "$_id", count: "$count" } },
      total: { $sum: "$count" }
    }
  },
  // Descomponemos el array creado anteriormente
  { $unwind: "$results" },
  // Calculamos para cada array el porcentaje respecto el total
  {
    $project: {
      _id: 0,
      result: "$results.result",
      count: "$results.count",
      percentage: { 
        $multiply: [
          { $divide: ["$results.count", "$total"] },
          100 
        ] 
      }
    }
  },
  //Ordenamos por porcentaje
  { $sort: { percentage: -1 } }
]);

//Consulta Z: Unir restaurantes con sus inspecciones usando $lookup.

db.restaurants.aggregate([
  {
    $lookup: {
      from: "inspections",
      let: { restaurant_id: "$_id" },
      pipeline: [
        {
          $addFields: {
            restaurant_id: { $toObjectId: "$restaurant_id" }
          }
        },
        {
          $match: {
            $expr: { $eq: ["$restaurant_id", "$$restaurant_id"] }
          }
        }
      ],
      as: "inspection_history"
    }
  }
]);

//Para poder hacer esta consulta previemente se ha identificado que restaurant_id en la collection de inspections se trataba de un string y no de un ObjectId, por lo que se ha tenido que modificar el campo en la collection de inspections para que fuera un ObjectId.

//Consulta para ver el tipo de restaurant_id
db.inspections.find().limit(5).forEach(doc => {
  printjson(typeof doc.restaurant_id);
});

//Consulta para cambair el tipo de restaurant_id a ObjectId

db.inspections.updateMany(
  { restaurant_id: { $type: "string" } }, // Filtra documentos donde restaurant_id es string
  [{ $set: { restaurant_id: { $toObjectId: "$restaurant_id" } } }] // Convierte a ObjectId
);


//4 - Optimización del rendimiento

//Índice 1
    //Consulta común (con explain) - Encontrar todas las inspecciones con un resultado específico
    db.inspections.find({ result: "Fail" }).explain("executionStats");
    //Índice creado
    db.inspections.createIndex({ result: 1 });

//Índice 2
    //Consulta común (con explain) - Encontrar todas las inspecciones de un restaurante específico
    db.inspections.find({ restaurant_id: ObjectId('55f14312c7447c3da7051b30') }).explain("executionStats");
    //Índice creado
    db.inspections.createIndex({ restaurant_id: 1 });

//Índice 3
    //Consulta común (con explain) - Encontrar todas las inspecciones de una ciudad específica
    db.inspections.find({ "address.city": "CARDIFF" }).explain("executionStats");
    //Índice creado
    db.inspections.createIndex({ "address.city": 1 });

//Índice 4
    //Consulta común (con explain) - Encontrar todas las inspecciones con una fecha específica
    db.inspections.find({ date: "Apr 07 2022" }).explain("executionStats");
    //Índice creado
    db.inspections.createIndex({ date: 1 });

//5 - Estrategias de escalabilidad

sh.enableSharding("restaurant_db")

sh.shardCollection("restaurant_db.inspections", { "result": 1, "restaurant_id": 1 })

sh.shardCollection("restaurant_db.restaurants", { "rating": 1, "type_of_food": 1 })
