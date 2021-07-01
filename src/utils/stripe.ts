import Stripe from "stripe";
import { siteURL } from "../next.config";
import connectMongo from "./connectMongo";
import AffiliateSchema from "../mongooseModels/affiliate";

// I want to implement some sort of caching system for this to reduce load on the server with the requesting of the products and such

export interface CatalogueItem {
    price: Stripe.Price;
    product: Stripe.Product;
}

// Initialize Stripe
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
    const items = new Array<CatalogueItem>(prices.length);

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
    priceIDs: string[],
    customerID?: string
) {
    // Declare constants
    const MAX_QUANTITY = 15;

    // Generate the items to be featured in the checkout
    const lineItems = new Array<Stripe.Checkout.SessionCreateParams.LineItem>(
        priceIDs.length
    );

    for (let i = 0; i < priceIDs.length; i++) {
        lineItems[i] = {
            price: priceIDs[i],
            quantity: 1,
            adjustable_quantity: {
                enabled: true,
                maximum: MAX_QUANTITY,
            },
        };
    }

    // How am I going to store this customer on the frontend ? (embed something into the success URL ? BUT WHAT)
    if (typeof customerID === "undefined") {
        customerID = (await stripe.customers.create()).id;
    }

    // Create the checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
        cancel_url: `${siteURL}/checkout/cancel`,
        success_url: `${siteURL}/checkout/success?customerID=${customerID}`,
        payment_method_types: ["card"],
        line_items: lineItems,
        customer: customerID,
        mode: "payment", // Later on if I want to set up subscriptions im most likely going to have to set this conditionally
        shipping_address_collection: { allowed_countries: ["AU"] },
        allow_promotion_codes: true,
    });

    // HOW DO I ADD SHIPPING COSTS *************** (shr shipping rates in dashboard)

    // Return the URL to the checkout
    return checkoutSession.url;
}

// Transfer funds to the referrer
// What about paying referrers for subscriptions ?
export async function payReferrer(
    promoCodeID: Stripe.PromotionCode | string,
    checkoutSessionID: string
) {
    // Make sure that the API cant be called twice for the same thing otherwise a creator can make a loop where I pay them out everything
    //  - The api is called off of the discount created which is not shown to anyone at all and is created on the backend and therefore is safe
    // How will I handle refunds with this ?
    // Test this with 1 dollar payments as well to make sure that it works for them ? - make sure I can transfer small amounts to affiliates

    // Listen for customer.discount.created, get the percent off for the token and the checkout session ID
    // Get the checkout session from the ID and get its payment intent
    // From the payment intent get the gross profit and then get the percentage worth for this person (I can probably create them custom sign up links on the server side)
    // Now look at the ID of the coupon and look at what connected account it belonged to, then pay this connected account their percentage of the profit FROM the charge / payment intent

    // Preferably I dont want my own customers doing this discount code themselves - WHAT IF PEOPLE MAKE THEIR OWN THEN GET PAID FOR IT

    // Connect to the database
    await connectMongo();

    // First I want to look through the database and see what promocde

    // Get the response object
    const response = await stripe;

    return response;
}

// Add an affiliate and provide them with their own code
export async function addAffiliate(promoCode: string, couponID?: string) {
    // ----------------------------------------------------------------------------------------------------------------------
    // THERE COULD BE PROBLEMS WITH THIS REGARDING IF ONE OF THE OPERATIONS FAILS TOO LIKE BEFORE - MAKE SURE NOTHING CAN FAIL
    // ----------------------------------------------------------------------------------------------------------------------

    // Connect to the database
    await connectMongo();

    // Get the Stripe connect account for the affiliate or create one if it does not exist
    let accountID: string;

    // Check if there is an existing promo code and thus an existing account
    const affiliate = await AffiliateSchema.findOne({ promoCode });
    if (affiliate) {
        // Check if the account has submitted details, if it is, then return with an error, otherwise proceed with registration
        const account = await stripe.accounts.retrieve(affiliate.accountID);

        // If we attempt to register an affiliate that has a deleted account, make them a new Stripe account and register them with that

        // Check if the account has submitted details
        if (account.details_submitted) {
            throw new Error("This promo code already exists");
        } else {
            accountID = affiliate.accountID;
        }
    } else {
        if (!couponID) {
            throw new Error("Coupon ID is required");
        }

        // Make a new account and promo code (what kind of account - express ?)
        const account = stripe.accounts.create({ type: "express" });
        const promo = stripe.promotionCodes.create({
            coupon: couponID as string,
            code: promoCode,
        });

        // Set the accountID and promoID
        accountID = (await account).id;
        const promoCodeID = (await promo).id;

        // Also save this data in the database
        await AffiliateSchema.create({
            promoCode,
            promoCodeID,
            accountID,
        });
    }

    // Create a new account link
    const accountLink = await stripe.accountLinks.create({
        account: accountID,
        type: "account_onboarding",
        refresh_url: `${siteURL}/onboarding/success=false`,
        return_url: `${siteURL}/onboarding/success=true`,
    });

    // Return the link
    return accountLink.url;
}

// Maybe we should have another webhook that fires on an account being disconnected from the onboarding process which voids their referral ID
// Regardless there should be some other endpoint for what happens if an affiliate deletes their account
// Or maybe not - the user should be given some sort of way to reconnect with their affiliate link
