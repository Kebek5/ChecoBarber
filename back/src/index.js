import "dotenv/config";
import { readFileSync } from "node:fs";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import { resolvers } from "./resolvers.js";
import { userFromRequest } from "./auth.js";
import { paymentsRouter } from "./payments/routes.js";
import { webhooksRouter } from "./payments/webhooks.js";
import { connectMongo } from "./mongo.js";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
const __dirname = dirname(fileURLToPath(import.meta.url));
const typeDefs = readFileSync(join(__dirname, "schema.graphql"), "utf-8");

const app = express();
const httpServer = http.createServer(app);
await connectMongo();

const schema = makeExecutableSchema({ typeDefs, resolvers });

// Websocket en /graphql (las consultas normales siguen en "/")
const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });
const wsCleanup = useServer({ schema }, wsServer);

const server = new ApolloServer({
   schema,
   plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
         async serverWillStart() {
            return {
               async drainServer() {
                  await wsCleanup.dispose();
               },
            };
         },
      },
   ],
});
await server.start();

app.use(cors());

// Webhooks de Mercado Pago y PayPal (deben ser accesibles desde internet)
app.use("/webhooks", express.json({ limit: "1mb" }), webhooksRouter);

// API REST de pagos que consume el front (Astro hace de proxy con el token de la sesión)
app.use("/pagos", express.json({ limit: "1mb" }), paymentsRouter);

// GraphQL en "/" para no cambiar GRAPHQL_URL del front
app.use(
   "/",
   express.json({ limit: "1mb" }),
   expressMiddleware(server, {
      context: async ({ req }) => ({ user: userFromRequest(req) }),
   })
);

const port = Number(process.env.PORT) || 4000;
await new Promise((resolve) => httpServer.listen({ port }, resolve));

console.log(`Servidor GraphQL listo en http://localhost:${port}/`);
console.log(`Pagos:    http://localhost:${port}/pagos`);
console.log(`Webhooks: http://localhost:${port}/webhooks/mercadopago y /webhooks/paypal`);