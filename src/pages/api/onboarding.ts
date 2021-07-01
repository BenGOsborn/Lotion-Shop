import { NextApiRequest, NextApiResponse } from "next";
import { createAffiliate } from "../../utils/stripe";

export default async function onboarding(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "POST") {
        // Get the params from the request
        const {
            promoCode,
            couponID,
        }: { promoCode: string; couponID: string | undefined } = req.body;

        // Do a check for the params first
        if (!promoCode) {
            return res.status(400).end("Promo code is required");
        }

        // Get the affiliate
        const onboardingLink = await createAffiliate(promoCode, couponID);

        // Return the affiliate
        res.status(200).end(onboardingLink);
    } else {
        res.status(400).end("Invalid method");
    }
}
