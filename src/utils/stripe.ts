import Stripe from "stripe";
import { REFERRER_PORTION, SHIPPING_ID_NORMAL, siteURL } from "./constants";
import connectMongo from "./connectMongo";
import AffiliateSchema from "../mongooseModels/affiliate";
import { MAX_QUANTITY } from "./constants";
import { CartItem } from "../components/layout";

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_TEST as string, {
    apiVersion: "2020-08-27",
});

export interface CatalogueItem {
    price: Stripe.Price;
    product: Stripe.Product;
}

// Get a list of items from the shop
export async function getCatalogue() {
    // Get the data asynchronously
    const pricesPromise = stripe.prices.list({ limit: 100 });
    const productsPromise = stripe.products.list({ limit: 100 });

    // Get the data from the promises
    const prices = (await pricesPromise).data;
    const products = (await productsPromise).data;

    // Initialize and fill the catalogue
    const items = new Array<CatalogueItem>(prices.length);

    for (const [i, price] of prices.entries()) {
        for (const product of products) {
            if (price.product === product.id) {
                items[i] = { price, product };
            }
        }
    }

    // ****** We should filter items out that have one or the other not active

    // Return the items
    return items;
}

// Create a checkout session for users to pay with
export async function createCheckoutSession(
    items: CartItem[],
    customerID?: string,
    affiliateID?: string
) {
    // Connect to the database
    await connectMongo();

    // Generate the items to be featured in the checkout
    const lineItems = new Array<Stripe.Checkout.SessionCreateParams.LineItem>(
        items.length
    );

    for (let i = 0; i < items.length; i++) {
        lineItems[i] = {
            price: items[i].priceID,
            quantity: Math.min(items[i].quantity, MAX_QUANTITY), // This max is in place for custom amounts of items specified by the user
        };
    }

    // How am I going to store this customer on the frontend ? (embed something into the success URL ? BUT WHAT)
    if (typeof customerID === "undefined") {
        customerID = (await stripe.customers.create()).id;
    }

    // Create the checkout session
    let checkoutSession: Stripe.Response<Stripe.Checkout.Session>;

    // If there is a promocode apply the discount and pay the funds to the specified account
    if (affiliateID) {
        // Get the affiliate with the specified affiliate id
        const affiliate = await AffiliateSchema.findOne({ affiliateID });
        if (!affiliate) {
            throw new Error("No affiliate with this affiliate ID exists");
        }

        // Get the total price of the items (quantities and prices)
        let total = 0;

        for (const item of items) {
            const price = await stripe.prices.retrieve(item.priceID);
            total += (price.unit_amount as number) * item.quantity;
        }

        // Get the amount to pay the affiliate
        const payout = parseFloat((total * REFERRER_PORTION).toFixed(2));

        // Create the checkout session with the discounts applied and the amount to pay the referrer
        checkoutSession = await stripe.checkout.sessions.create({
            cancel_url: `${siteURL}/checkout`, // Would it be better to have a custom fail page which we can track ?
            success_url: `${siteURL}/checkout/success`,
            payment_method_types: ["card"],
            line_items: lineItems,
            customer: customerID,
            mode: "payment", // Later on if I want to set up subscriptions im most likely going to have to set this conditionally
            shipping_address_collection: { allowed_countries: ["AU"] },
            shipping_rates: [SHIPPING_ID_NORMAL], // The option for there to be premium shipping options should exist later as upsells (enums of different shipping IDs)
            payment_intent_data: {
                transfer_data: {
                    amount: payout,
                    destination: affiliate.accountID,
                },
            },
        });
    } else {
        // Create the standard checkout session
        checkoutSession = await stripe.checkout.sessions.create({
            cancel_url: `${siteURL}/checkout`, // Would it be better to have a custom fail page which we can track ?
            success_url: `${siteURL}/checkout/success`,
            payment_method_types: ["card"],
            line_items: lineItems,
            customer: customerID,
            mode: "payment", // Later on if I want to set up subscriptions im most likely going to have to set this conditionally
            shipping_address_collection: { allowed_countries: ["AU"] },
            shipping_rates: [SHIPPING_ID_NORMAL], // The option for there to be premium shipping options should exist later as upsells (enums of different shipping IDs)
        });
    }

    // Add tax option to checkout ?

    // Return the URL to the checkout and the id of the session and the user to be stored as a cookie
    return {
        url: checkoutSession.url,
        checkoutID: checkoutSession.id,
        customerID: customerID,
    };
}
