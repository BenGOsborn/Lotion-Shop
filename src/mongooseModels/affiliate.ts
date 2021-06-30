import mongoose, { Document } from "mongoose";

export interface IReferral extends Document {
    paymentIntentID: string;
    transferID: string;
}

export interface IAffiliate extends Document {
    promoCode: string;
    promoCodeID: string;
    accountID: string;
    referrals: IReferral[];
}

// Define the schema for each referral
//  - Pay intent ID useful for identifying which payment intent is to be reversed AND making sure this referrel does not occur multiple times
//  - Transfer ID useful for reversing the transfer that occurred from the payment intent
const referralSchema = new mongoose.Schema(
    {
        paymentIntentID: { type: String, required: true },
        transferID: { type: String, required: true },
    },
    { timestamps: true }
);

// Define the schemas for the affiliates
//  - Promo code used for referring out customers (can be read by the affiliate)
//  - Promo code ID is the ID of the promo code and is used for identifying the person whose code was fired
//  - Account ID is used for transfering funds on a successful referral
//  - Referrals contains a list of referrals
const affiliateSchema = new mongoose.Schema(
    {
        promoCode: { type: String, required: true },
        promoCodeID: { type: String, required: true },
        accountID: { type: String, required: true },
        referrals: [referralSchema],
    },
    { timestamps: true }
);

// Export the schema
const AffiliateSchema: mongoose.Model<IAffiliate> =
    mongoose.models.Affiliate ||
    mongoose.model<IAffiliate>("Affiliate", affiliateSchema);
export default AffiliateSchema;
