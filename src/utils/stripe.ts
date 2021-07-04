import Stripe from "stripe";
import {
    COUPON_ID_NORMAL,
    REFERRER_PORTION,
    SHIPPING_ID_NORMAL,
    siteURL,
} from "./constants";
import connectMongo from "./connectMongo";
import AffiliateSchema from "../mongooseModels/affiliate";
import { MAX_QUANTITY } from "./constants";
import { CartItem } from "../components/layout";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_TEST as string, {
    apiVersion: "2020-08-27",
});

// Get a list of products
export async function getProducts() {
    // Get a list of products
    const products = (await stripe.products.list({ limit: 100 })).data;

    // Return the list of products
    return products;
}

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

export interface ProductDetails {
    product: Stripe.Product;
    prices: Stripe.Price[];
}

// Get the details for a product
export async function getProductDetails(productID: string) {
    // Get the data asynchoronously
    const pricesPromise = stripe.prices.list({ limit: 100 });
    const productPromise = stripe.products.retrieve(productID);

    // Get the data from the promises
    const product = await productPromise;

    // Get the prices that belong to the product
    const prices: Stripe.Price[] = [];
    for (const price of (await pricesPromise).data) {
        if (price.product === productID) {
            prices.push(price);
        }
    }

    // ****** We should filter items out that have one or the other not active

    // Return the data
    return { product, prices: prices } as ProductDetails;
}

interface CheckoutResponse {
    url: string;
    checkoutID: string;
    customerID: string;
}

// Get the receipt from a checkout session
export async function retrieveReceipt(checkoutSessionID: string) {
    // Get the checkout
    const checkoutSession = await stripe.checkout.sessions.retrieve(
        checkoutSessionID
    );

    // Get the payment intent from the session
    const paymentIntentID = checkoutSession.payment_intent;
    const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentID as string
    );

    // Get the url of the receipt and return it
    const receipt = paymentIntent.charges.data[0].receipt_url;

    return receipt as string;
}

export async function cartPrice(items: CartItem[]) {
    // Get the total price of the items (quantities and prices)
    let total = 0;

    for (const item of items) {
        const price = await stripe.prices.retrieve(item.priceID);
        total += (price.unit_amount as number) * item.quantity;
    }

    // Return the total count
    return total;
}

// Create a checkout session for users to pay with
export async function createCheckoutSession(
    items: CartItem[],
    customerID?: string,
    promoCode?: string
) {
    // Connect to the database
    connectMongo();

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

    // If there is a promo code then make this session into one with the discount already applied INSIDE of a cookie (valid for 5 days) (they get promo code from a custom link)
    // This means I will have to set up the affiliates section before I can properly implement this (I need to apply the discounts param to the checkout)

    // Add tax option to checkout ?

    // Create the checkout session
    let checkoutSession: Stripe.Response<Stripe.Checkout.Session>;

    // If there is a promocode apply the discount and pay the funds to the specified account
    if (promoCode) {
        // Get the affiliate with the specified promo code
        const affiliate = await AffiliateSchema.findOne({ promoCode });
        if (!affiliate) {
            throw new Error("Invalid promo code");
        }

        // Get the amount to pay the referrer
        const price = await cartPrice(items);
        const payout = (price * REFERRER_PORTION).toFixed(2);

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
            discounts: [
                affiliate.promoCodeID as Stripe.Checkout.SessionCreateParams.Discount,
            ],
            // @ts-ignore
            transfer_data: {
                amount: payout,
                destination: affiliate.accountID,
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

    // Well MAYBE, what we should do, is have affiliates send out a link which automatically transfers them a specific amount of money if it is valid VIA a cookie

    // Return the URL to the checkout and the id of the session and the user to be stored as a cookie
    return {
        url: checkoutSession.url,
        checkoutID: checkoutSession.id,
        customerID: customerID,
    } as CheckoutResponse;
}

// Initialize an affiliate OR revive a disabled affiliate account
export async function initializeAffiliate(promoCode: string) {
    // Initialize the database
    await connectMongo();

    // Make sure the promo code does not already exist
    const affiliate = await AffiliateSchema.findOne({ promoCode: promoCode });
    if (affiliate && !affiliate.active) {
        throw new Error("Affiliate with this ID is active");
    }

    // Create promises for a new promo code and account
    const promoPromise = stripe.promotionCodes.create({
        coupon: COUPON_ID_NORMAL,
        code: promoCode,
    });
    const accountPromise = stripe.accounts.create({ type: "express" });

    // If there is an existing affiliate then reinitialize the values, otherwise create new ones
    if (affiliate) {
        // Wait for the values
        const promo = await promoPromise;
        const account = await accountPromise;

        // Update the affiliate status to active and initialize the new values
        await AffiliateSchema.updateOne(
            { promoCode: promoCode },
            {
                $set: {
                    promoCodeID: promo.id,
                    accountID: account.id,
                    active: true,
                },
            }
        );
    } else {
        // Wait for the values
        const promo = await promoPromise;
        const account = await accountPromise;

        // Create a new affiliate
        await AffiliateSchema.create({
            promoCode: promoCode,
            promoCodeID: promo.id,
            accountID: account.id,
        });
    }
}

// Create an onboarding link for the affiliate
export async function onboardAffiliate(promoCode: string) {
    // Initialize the database
    await connectMongo();

    // Find the database entry that has the specified promo code
    const affiliate = await AffiliateSchema.findOne({ promoCode: promoCode });
    if (!affiliate || !affiliate.active) {
        throw new Error("Invalid promo code");
    }

    // Create an onboarding link for the affiliate account
    const accountLink = await stripe.accountLinks.create({
        account: affiliate.accountID,
        type: "account_onboarding",
        refresh_url: `${siteURL}/onboarding/success=false`,
        return_url: `${siteURL}/onboarding/success=true`,
    });

    // Return the onboarding link
    return accountLink.url;
}

// Disable the affiliate
export async function disableAffiliate(promoCode: string) {
    // Initialize the database
    await connectMongo();

    // Here we want to get the database entry of the affiliate
    const affiliate = await AffiliateSchema.findOne({ promoCode: promoCode });
    if (!affiliate || !affiliate.active) {
        throw new Error("Invalid promo code");
    }

    // Now we want to reject the account and disable the promo code, as well as set the status to be inactive
    const rejectAcc = stripe.accounts.reject(affiliate.accountID, {
        reason: "other",
    });
    const disablePromo = stripe.promotionCodes.update(affiliate.promoCodeID, {
        active: false,
    });
    const updateActive = AffiliateSchema.updateOne(
        { promoCode: promoCode },
        { $set: { active: false } }
    );

    // Wait for the promises
    await Promise.all([rejectAcc, disablePromo, updateActive]);
}

// -
// -
// -
// -
// -
// -
// -
// -
// -
// -
// -
// Used for testing different methods
export async function testMethod() {
    // So at the moment im trying to figure out some sort of way of reonboarding connected accounts that have disconnected from the platform
    // How can I keep track of all accounts that are payable ???
    // Maybe I can use retrieve capability ?
    // Maybe look at the disabled reason ?
    // Make sure this takes account for accounts that have been deleted as well (wrap in a try catch block Im assuming)

    // const response = await stripe.paymentIntents.retrieve(
    //     "pi_1J7txZC7YoItP8TewPUhZvY7"
    // );

    // const response = stripe.prices.list({ limit: 100 });

    // const response = await stripe.checkout.sessions.retrieve(
    //     "cs_test_a1KxhZsqYKjk1rViQuc9vpi7ldgrvSHx05KXbh46UX1sQ8fbBSYsStK3qz"
    // );

    const response = await stripe.paymentIntents.retrieve(
        "pi_1J9JrpC7YoItP8TeBAWnDPAU"
    );

    return response;
}
