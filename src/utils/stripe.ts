import Stripe from "stripe";
import { siteURL } from "./constants";
import connectMongo from "./connectMongo";
import AffiliateSchema from "../mongooseModels/affiliate";
import { MAX_QUANTITY } from "./constants";

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

    // Return the data
    return { product, prices: prices } as ProductDetails;
}

// Create a checkout session for users to pay with
export async function createCheckoutSession(
    priceIDs: string[],
    customerID?: string
) {
    // Generate the items to be featured in the checkout
    const lineItems = new Array<Stripe.Checkout.SessionCreateParams.LineItem>(
        priceIDs.length
    );

    for (let i = 0; i < priceIDs.length; i++) {
        lineItems[i] = {
            price: priceIDs[i],
            quantity: Math.min(1, MAX_QUANTITY), // This max is in place for custom amounts of items specified by the user
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
    // ALSO REDIRECT TO THE SITE WITH THE PI TO GET THE RECEIPT AS A PARAM
    // AFFILIATES SHOULD BE ABLE TO SEND THEIR LINK AS A CODE - HAVE THIS AS A PARAM VIA THE 'discounts' parameter of the checkout
    // Well MAYBE, what we should do, is have affiliates send out a link which automatically transfers them a specific amount of money if it is valid VIA a cookie
    // Maybe also provide some way of letting the customers choose their quantities on the frontend which gets sent here with the codes and filled out automatically ?
    // Remove the adjustable pricing - the user should decide this when they are shopping

    // I can send through the session URL along with the payment ID which I can store on the clients session as a cookie to expire
    // Then when the user finishes the payment and goes to the success page, the token will be there to get the receipt from
    // If the user does not finish and goes to the failure, then the cookie will be destroyed and redirected to the checkout
    // Make sure this checkout and success / failure routes throw errors if the wrong thing is specified (do it under the checkout folder with index, success, and failure)

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

    // const response = await stripe.paymentIntents.retrieve(
    //     "pi_1J7txZC7YoItP8TewPUhZvY7"
    // );

    // const response = stripe.prices.list({ limit: 100 });

    const response = await stripe.charges.retrieve(
        "ch_1J7tyOC7YoItP8TeMnav41P1"
    );

    return response;
}
