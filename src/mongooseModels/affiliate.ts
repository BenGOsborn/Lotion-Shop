import mongoose from "mongoose";

export interface Referral {
    paymentIntentID: string;
    transferID: string;
}

export interface Affiliate {
    referralCode: string;
    promoCodeID: string;
    accountID: string;
    referrals: Referral[];
}

const referralSchema = new mongoose.Schema<Referral>({
    paymentIntentID: { type: String, required: true },
    transferID: { type: String, required: true },
});

// Define the schemas for the
const affiliateSchema = new mongoose.Schema<Affiliate>({
    referralCode: { type: String, required: true },
    promoCodeID: { type: String, required: true },
    accountID: { type: String, required: true },
    referrals: [referralSchema],
});

// Export the schema
export default mongoose.models.Affiliate ||
    mongoose.model("Affiliate", affiliateSchema);
