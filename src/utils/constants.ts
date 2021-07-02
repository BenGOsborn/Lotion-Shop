// The URL of the site
export const siteURL: string =
    process.env.NODE_ENV !== "production"
        ? "http://localhost:3000"
        : "https://siteurl.com";

// The max quantity of items a user can add to their cart
export const MAX_QUANTITY = 15;
