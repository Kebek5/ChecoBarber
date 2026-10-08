import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import "dotenv/config";

import { resolvers } from "./resolvers.js";

import { userFromRequest } from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const typeDefs = readFileSync(join(__dirname, "schema.graphql"), "utf-8");

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
   listen: { port: Number(process.env.PORT) || 4000 },
   context: async ({ req }) => ({ user: userFromRequest(req) }),
});

console.log(`Servidor GraphQL listo en ${url}`);
