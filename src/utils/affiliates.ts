import AffiliateSchema from "../mongooseModels/affiliate";
import connectMongo from "./connectMongo";
import { COUPON_ID_NORMAL, siteURL } from "./constants";
import { stripe } from "./stripe";

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

    // Create promises for a new promo code and account
    // ********* Instead of creating a new one, check if one exists with that name first, if it does then set its active status to be true and set the ID to be that promo code ID

    // Retrieve the promo code with the same name
    let existingCode: string | undefined = undefined;

    const promoCodes = await stripe.promotionCodes.list();
    for (const code of promoCodes.data) {
        if (code.code === promoCode) {
            existingCode = code.id;
            break;
        }
    }

    // ********** THen I need to check what if the ID exists on Stripe for some reason ? I also need to then just update instead of making a new one

    const promoPromise = stripe.promotionCodes.create({
        coupon: COUPON_ID_NORMAL,
        code: promoCode,
    });
    const accountPromise = stripe.accounts.create({ type: "express" });

    // Wait for the values
    const promo = await promoPromise;
    const account = await accountPromise;

    // Create a new affiliate and save in the database
    await AffiliateSchema.create({
        promoCode: promoCode,
        promoCodeID: promo.id,
        accountID: account.id,
    });
}

// Create an onboarding link for the affiliate
export async function onboardAffiliate(promoCode: string) {
    // Initialize the database
    await connectMongo();

    // Find the database entry that has the specified promo code
    const affiliate = await AffiliateSchema.findOne({ promoCode: promoCode });
    if (!affiliate) {
        throw new Error("No existing affiliate with this promo code");
    }

    // Create an onboarding link for the affiliate account
    const accountLink = await stripe.accountLinks.create({
        account: affiliate.accountID,
        type: "account_onboarding",
        refresh_url: `${siteURL}/`, // Create better success and failure messages
        return_url: `${siteURL}/`,
    });

    // Return the onboarding link
    return accountLink.url;
}

// Delete the affiliate
export async function deleteAffiliate(promoCode: string) {
    // Initialize the database
    await connectMongo();

    // Here we want to get the database entry of the affiliate
    const affiliate = await AffiliateSchema.findOne({ promoCode: promoCode });
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
    const deleteAffiliate = AffiliateSchema.deleteOne({ promoCode: promoCode });

    // Wait for the promises
    await Promise.all([rejectAcc, disablePromo, deleteAffiliate]);
}
