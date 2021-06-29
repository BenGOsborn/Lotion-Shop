import { gql } from "apollo-server-core";

export interface Query {}

export interface RegisterType {}

export const adminTypeDef = gql`
    type Admin {
        login: String!
        register: String!
    }

    type Query {
        admins: Admin!
    }
`;
