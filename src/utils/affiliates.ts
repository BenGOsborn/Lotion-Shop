import AffiliateSchema from "../mongooseModels/affiliate";
import connectMongo from "./connectMongo";
import { siteURL } from "./constants";
import { stripe } from "./stripe";

// Check if an affiliate ID exists
export async function affiliateIDExists(affiliateID: string) {
    // Connect to the database
    connectMongo();

    // Get the affiliate with the specified affiliate ID
    const affiliate = await AffiliateSchema.findOne({ affiliateID });
    if (!affiliate) {
        return false;
    }

    // Return true if the account is payable else false
    const account = await stripe.accounts.retrieve(affiliate.accountID);
    if (account.details_submitted) {
        return true;
    }

    return false;
}
