import AffiliateSchema from "../mongooseModels/affiliate";
import connectMongo from "./connectMongo";
import { siteURL } from "./constants";
import { stripe } from "./stripe";

export async function promoCodeExists(affiliateID: string) {
    // Connect to the database
    connectMongo();

    // Get the affiliate with the specified affiliate ID
    const affiliate = await AffiliateSchema.findOne({ affiliateID });
    if (!affiliate) {
        return false;
    }

    // Return true
    return true;
}

// Initialize an affiliate
export async function initializeAffiliate(affiliateID: string) {
    // Initialize the database
    await connectMongo();

    // Make sure the affiliate ID does not already exist
    const affiliate = await AffiliateSchema.findOne({ affiliateID });
    if (affiliate) {
        throw new Error("Affiliate with this promo code exists");
    }

    // Create a new account
    const accountID = (await stripe.accounts.create({ type: "express" })).id;

    // Create a new affiliate and save in the database
    await AffiliateSchema.create({ affiliateID, accountID });
}

// Create an onboarding link for the affiliate
export async function onboardAffiliate(affiliateID: string) {
    // Initialize the database
    await connectMongo();

    // Find the database entry that has the specified affiliate id
    const affiliate = await AffiliateSchema.findOne({ affiliateID });
    if (!affiliate) {
        throw new Error("No existing affiliate with this affiliate ID");
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
export async function deleteAffiliate(affiliateID: string) {
    // Initialize the database
    await connectMongo();

    // Here we want to get the database entry of the affiliate
    const affiliate = await AffiliateSchema.findOne({ affiliateID });
    if (!affiliate) {
        throw new Error("No existing affiliate with this affiliate ID");
    }

    // Reject the users stripe account, and delete the database entry
    const rejectAcc = stripe.accounts.reject(affiliate.accountID, {
        reason: "other",
    });
    const deleteAffiliate = AffiliateSchema.deleteOne({ affiliateID });

    // Wait for the promises
    await Promise.all([rejectAcc, deleteAffiliate]);
}
