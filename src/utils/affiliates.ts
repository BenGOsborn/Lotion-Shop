import AffiliateSchema from "../mongooseModels/affiliate";
import connectMongo from "./connectMongo";
import { COUPON_ID_NORMAL, siteURL } from "./constants";
import { stripe } from "./stripe";
import Stripe from "stripe";

export async function promoCodeExists(promoCode: string) {
    // Connect to the database
    connectMongo();

    // Get the affiliate with the specified promo code
    const affiliate = await AffiliateSchema.findOne({ promoCode });
    if (!affiliate) {
        return false;
    }

    // Return true
    return true;
}

// Initialize an affiliate
export async function initializeAffiliate(promoCode: string) {
    // Initialize the database
    await connectMongo();

    // Make sure the promo code does not already exist
    const affiliate = await AffiliateSchema.findOne({ promoCode: promoCode });
    if (affiliate) {
        throw new Error("Affiliate with this promo code exists");
    }

    // Retrieve the promo code with the same name
    let promoCodeID: string | undefined = undefined;

    const promoCodes = await stripe.promotionCodes.list();
    for (const code of promoCodes.data) {
        if (code.code === promoCode) {
            promoCodeID = code.id;
            break;
        }
    }

    // Make a new promo code if it does not exist else set the existing one to active
    if (promoCodeID) {
        // Set the promo code to be active
        await stripe.promotionCodes.update(promoCodeID, {
            active: true,
        });
    } else {
        // Create a new promo code ID
        promoCodeID = (
            await stripe.promotionCodes.create({
                coupon: COUPON_ID_NORMAL,
                code: promoCode,
            })
        ).id;
    }

    // Create a new account
    const accountID = (await stripe.accounts.create({ type: "express" })).id;

    // Create a new affiliate and save in the database
    await AffiliateSchema.create({ promoCode, promoCodeID, accountID });
}

// Create an onboarding link for the affiliate
export async function onboardAffiliate(promoCode: string) {
    // Initialize the database
    await connectMongo();

    // Find the database entry that has the specified promo code
    const affiliate = await AffiliateSchema.findOne({ promoCode });
    if (!affiliate) {
        throw new Error("No existing affiliate with this promo code");
    }

    // Create an onboarding link for the affiliate account
    const accountLink = await stripe.accountLinks.create({
        account: affiliate.accountID,
        type: "account_onboarding",
        refresh_url: `${siteURL}`, // ************* Create better success and failure messages
        return_url: `${siteURL}`,
    });

    // Return the onboarding link
    return accountLink.url;
}

// Delete the affiliate
export async function deleteAffiliate(promoCode: string) {
    // Initialize the database
    await connectMongo();

    // Here we want to get the database entry of the affiliate
    const affiliate = await AffiliateSchema.findOne({ promoCode });
    if (!affiliate) {
        throw new Error("No existing affiliate with this promo code");
    }

    // Reject the users stripe account, disable their promo code, and delete the database entry
    const rejectAcc = stripe.accounts.reject(affiliate.accountID, {
        reason: "other",
    });
    const disablePromo = stripe.promotionCodes.update(affiliate.promoCodeID, {
        active: false,
    });
    const deleteAffiliate = AffiliateSchema.deleteOne({ promoCode });

    // Wait for the promises
    await Promise.all([rejectAcc, disablePromo, deleteAffiliate]);
}
