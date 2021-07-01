import { NextApiRequest, NextApiResponse } from "next";
import { initializeAffiliate } from "../../utils/stripe";

export default async function onboarding(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "POST") {
        // Initialize an account
        // Get the params from the request
        const { promoCode, couponID }: { promoCode: string; couponID: string } =
            req.body;

        // Do a check for the params first
        if (!promoCode || !couponID) {
            return res.status(400).end("Missing parameter");
        }

        // Get the affiliate
        const onboardingLink = await initializeAffiliate(promoCode, couponID);

        // Return the affiliate
        res.status(200).end(onboardingLink);
    } else {
        res.status(400).end("Invalid method");
    }
}
