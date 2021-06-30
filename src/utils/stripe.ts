import Stripe from "stripe";
import { siteURL } from "../next.config";

// I want to implement some sort of caching system for this to reduce load on the server with the requesting of the products and such

export interface ShopItem {
    price: Stripe.Price;
    product: Stripe.Product;
}

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
    const items = new Array<ShopItem>(prices.length);

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

export interface CheckoutItem {
    priceID: string;
    quantity: number;
}

// Create a payment intent for the purchase
export async function createCheckoutSession(items: CheckoutItem[]) {
    // Get the catalogue of items
    const catalogue = await getCatalogue();

    // How am I going to handle the storing of the different customers or will this be done automatically ?
    // Maybe instead of using charges I should switch over to payment intents at some point

    const description = stripe.checkout.sessions.create({ cancel_url: `${siteURL}/cancel` } });
}
