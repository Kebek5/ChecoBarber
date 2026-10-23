import { PubSub } from "graphql-subscriptions";

// En memoria: sirve con un solo proceso del servidor.
// Si algún día corres varias instancias, se cambia por Redis sin tocar los resolvers.
export const pubsub = new PubSub();

export const TOPICS = {
   PRODUCT_CREATED: "PRODUCT_CREATED",
};