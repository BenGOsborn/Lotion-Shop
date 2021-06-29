export const adminResolver = {
    Query: {
        admins: () => {
            return { login: "lol", register: "lul" };
        },
    },
    Admin: {
        login: () => "Logged in",
        register: () => "Registered",
    },
};
