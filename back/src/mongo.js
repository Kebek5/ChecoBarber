import { MongoClient } from "mongodb";
import "dotenv/config";

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "checobarber";

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
let db;

export async function connectMongo() {
   await client.connect();
   db = client.db(dbName);
   // Consulta típica: todos los eventos de un pedido, en orden cronológico
   await db.collection("pedido_eventos").createIndex({ pedidoId: 1, creadoEn: 1 });
   console.log(`MongoDB conectado: ${dbName}`);
}

export function eventosCollection() {
   if (!db) throw new Error("MongoDB no está conectado.");
   return db.collection("pedido_eventos");
}

export const closeMongo = () => client.close();