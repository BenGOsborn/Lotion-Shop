import { ApolloServer } from "apollo-server-micro";
import { LoginType, adminTypeDef } from "../../typeDefs/admin";
import { adminResolver } from "../../resolvers/admin";

const apolloServer = new ApolloServer({
    typeDefs: adminTypeDef,
    resolvers: adminResolver,
});

const handler = apolloServer.createHandler({ path: "/api/graphql" });

export const config = {
    api: {
        bodyParser: false,
    },
};

export default handler;
