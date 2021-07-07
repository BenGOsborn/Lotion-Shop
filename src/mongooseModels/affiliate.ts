import mongoose, { Document } from "mongoose";

export interface IAffiliate extends Document {
    affiliateID: string;
    accountID: string;
    password: string | null;
}

// Define the schemas for the affiliates
//  - Affiliate ID is used for identifying the referrer
//  - Account ID is used for transfering funds on a successful referral
//  - Password is the password required to access the affiliate account
const affiliateSchema = new mongoose.Schema(
    {
        affiliateID: { type: String, required: true },
        accountID: { type: String, required: true },
        password: { type: String, default: "" },
    },
    { timestamps: true }
);

// Export the schema
const AffiliateSchema: mongoose.Model<IAffiliate> =
    mongoose.models.Affiliate ||
    mongoose.model<IAffiliate>("Affiliate", affiliateSchema);
export default AffiliateSchema;
