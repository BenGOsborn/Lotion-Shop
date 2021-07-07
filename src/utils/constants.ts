// The URL of the site
export const siteURL: string =
    process.env.NODE_ENV !== "production"
        ? "http://localhost:3000"
        : "https://siteurl.com";

// The max quantity of items a user can add to their cart
export const MAX_QUANTITY = 15;

// Stripe base shipping ID
export const SHIPPING_ID_NORMAL = "shr_1J9GyTC7YoItP8Te9w4rQSDQ";

// The portion paid out to referrers
export const REFERRER_PORTION = 0.15;

// The number of items to display per row
export const ITEMS_PER_ROW = 4;
