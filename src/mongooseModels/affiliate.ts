import mongoose, { Document } from "mongoose";

export interface IAffiliate extends Document {
    promoCode: string;
    promoCodeID: string;
    accountID: string;
}

// Define the schemas for the affiliates
//  - Promo code used for referring out customers (can be read by the affiliate)
//  - Promo code ID is the ID of the promo code and is used for identifying the person whose code was fired
//  - Account ID is used for transfering funds on a successful referral
const affiliateSchema = new mongoose.Schema(
    {
        promoCode: { type: String, required: true },
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
