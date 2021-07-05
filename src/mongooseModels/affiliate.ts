import mongoose, { Document } from "mongoose";

export interface IAffiliate extends Document {
    affiliateID: string;
    accountID: string;
}

// Define the schemas for the affiliates
//  - Affiliate ID is used for identifying the referrer
//  - Account ID is used for transfering funds on a successful referral
const affiliateSchema = new mongoose.Schema(
    {
        affiliateID: { type: String, required: true },
        accountID: { type: String, required: true },
    },
    { timestamps: true }
);

// Export the schema
const AffiliateSchema: mongoose.Model<IAffiliate> =
    mongoose.models.Affiliate ||
    mongoose.model<IAffiliate>("Affiliate", affiliateSchema);
export default AffiliateSchema;
