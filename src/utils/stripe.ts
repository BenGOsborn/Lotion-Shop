import Stripe from "stripe";
import { siteURL } from "../next.config";

// I want to implement some sort of caching system for this to reduce load on the server with the requesting of the products and such

const stripe = new Stripe(process.env.STRIPE_SECRET_TEST as string, {
    apiVersion: "2020-08-27",
});

// Get a list of items from the shop
export async function getCatalogue() {
    // Get the data asynchronously
    const pricesPromise = stripe.prices.list({ limit: 100 });
    const productsPromise = stripe.products.list({ limit: 100 });

    // Get the data from the promises
    const prices = (await pricesPromise).data;
    const products = (await productsPromise).data;

    // Initialize and fill the list of items
    const items = new Array<{ price: Stripe.Price; product: Stripe.Product }>(
        prices.length
    );

    for (const [i, price] of prices.entries()) {
        for (const product of products) {
            if (price.product === product.id) {
                items[i] = { price, product };
            }
        }
    }

    // Return the items
    return items;
}

// Create a checkout session for users to pay with
export async function createCheckoutSession(
    costIDs?: string[],
    customerID?: string
) {
    // Declare constants
    const MAX_QUANTITY = 15;

    // Get the catalogue of items
    const catalogue = await getCatalogue();

    // How will I store customers ? (that is the question isnt it! (dont LOL))

    const lineItems = new Array<Stripe.Checkout.SessionCreateParams.LineItem>(
        catalogue.length
    );

    for (let i = 0; i < lineItems.length; i++) {
        lineItems[i] = {
            price: catalogue[i].price.id,
            quantity: 1,
            adjustable_quantity: {
                enabled: true,
                maximum: MAX_QUANTITY,
            },
        };
    }

    // How am I going to store this customer on the frontend ? (embed something into the success URL ? BUT WHAT)

    const paymentIntent = await stripe.checkout.sessions.create({
        cancel_url: `${siteURL}/cancel`,
        success_url: `${siteURL}/success`,
        payment_method_types: ["card"],
        line_items: lineItems,
        customer: undefined, // Maybe this can be stored on the client and can be used for recurring purchases with them ?
        mode: "payment",
        shipping_address_collection: { allowed_countries: ["AU"] },
        allow_promotion_codes: true,
    });

    return paymentIntent.url;
}
