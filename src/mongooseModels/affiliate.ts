import mongoose, { Document } from "mongoose";

export interface IAffiliate extends Document {
    promoCodeID: string;
    accountID: string;
}

// ************** I have just removed the promoCode from this - replace this with the id of the object - good luck

// Define the schemas for the affiliates
//  - Promo code used for referring out customers (can be read by the affiliate)
//  - Promo code ID is the ID of the promo code and is used for identifying the person whose code was fired
//  - Account ID is used for transfering funds on a successful referral
const affiliateSchema = new mongoose.Schema(
    {
        promoCodeID: { type: String, required: true },
        accountID: { type: String, required: true },
    },
    { timestamps: true }
);

// Export the schema
const AffiliateSchema: mongoose.Model<IAffiliate> =
    mongoose.models.Affiliate ||
    mongoose.model<IAffiliate>("Affiliate", affiliateSchema);
export default AffiliateSchema;
