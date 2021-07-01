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
// ********** This also needs updating big time
export async function payReferrer(
    promoCodeID: Stripe.PromotionCode | string,
    checkoutSessionID: string
) {
    // Declare the percentage of revenue to pay out to affiliates
    const PERCENTAGE = 0.15;

    // Connect to the database
    await connectMongo();

    // Get the payment intent ID from the checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(
        checkoutSessionID as string
    );
    const paymentIntentID = checkoutSession.payment_intent as string;

    // Check that this payment intent has not already been paid out
    const existingIntent = await AffiliateSchema.findOne({
        referrals: { $elemMatch: { paymentIntentID: paymentIntentID } },
    });
    if (existingIntent) {
        throw new Error("This referral has already paid out");
    }

    // Get the payment intent and the referral code account
    const paymentIntentPromise = stripe.paymentIntents.retrieve(
        checkoutSession.payment_intent as string
    );
    const affiliatePromise = AffiliateSchema.findOne({
        promoCodeID: promoCodeID as string,
    }); // What happens if it cant find an affiliate ?

    // Wait for the payment intent and get the amount to pay out from it in the correct currency
    const paymentIntent = await paymentIntentPromise;
    const transferAmount = paymentIntent.amount * PERCENTAGE;
    const transferCurrency = paymentIntent.currency;

    // Get the affiliate and pay their account the amount
    const affiliate = await affiliatePromise;
    const transfer = await stripe.transfers.create({
        amount: transferAmount,
        currency: transferCurrency,
        destination: affiliate?.accountID as string,
    });

    // Save the details of the payout
    await AffiliateSchema.updateOne(
        { promoCodeID: promoCodeID as string },
        { $push: { referrals: { paymentIntentID, transferID: transfer.id } } }
    );
}

// // Initialize an affiliate OR revive a disabled affiliate account
// export async function initializeAffiliateLegacy(
//     promoCode: string,
//     couponID: string
// ) {
//     // Connect to the database
//     await connectMongo();

//     // Get the Stripe connect account for the affiliate or create one if it does not exist
//     let accountID: string;

//     // Check if there is an existing promo code and thus an existing account
//     const affiliate = await AffiliateSchema.findOne({ promoCode });
//     if (affiliate) {
//         // Check if the account has submitted details, if it is, then return with an error, otherwise proceed with registration
//         const account = await stripe.accounts.retrieve(affiliate.accountID);

//         // Check if the account has submitted details
//         if (account.details_submitted) {
//             throw new Error("This promo code already exists");
//         } else {
//             accountID = affiliate.accountID;
//         }
//     } else {
//         if (!couponID) {
//             throw new Error("Coupon ID is required");
//         }

//         // Make a new account and promo code (what kind of account - express ?)
//         const account = stripe.accounts.create({ type: "express" });
//         const promo = stripe.promotionCodes.create({
//             coupon: couponID as string,
//             code: promoCode,
//         });

//         // Set the accountID and promoID
//         accountID = (await account).id;
//         const promoCodeID = (await promo).id;

//         // Also save this data in the database
//         await AffiliateSchema.create({
//             promoCode,
//             promoCodeID,
//             accountID,
//         });
//     }

//     // Create a new account link
//     const accountLink = await stripe.accountLinks.create({
//         account: accountID,
//         type: "account_onboarding",
//         refresh_url: `${siteURL}/onboarding/success=false`,
//         return_url: `${siteURL}/onboarding/success=true`,
//     });

//     // Return the link
//     return accountLink.url;
// }

// ********** Perform checks for different error conditions for the following

// Initialize an affiliate OR revive a disabled affiliate account
export async function initializeAffiliate(promoCode: string, couponID: string) {
    // Initialize the database
    await connectMongo();

    // Make sure the promo code does not already exist
    const affiliate = await AffiliateSchema.findOne({ promoCode: promoCode });
    if (affiliate && !affiliate.active) {
        throw new Error("Affiliate with this ID is active");
    }

    // Create promises for a new promo code and account
    const promoPromise = stripe.promotionCodes.create({
        coupon: couponID,
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

    const response = await stripe.accounts.retrieve("acct_1J8Cqs2HXem9TS1I");

    return response;
}
