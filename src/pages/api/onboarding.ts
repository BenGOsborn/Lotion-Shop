import { NextApiRequest, NextApiResponse } from "next";
import { initializeAffiliate, deleteAffiliate } from "../../utils/affiliates";

export default async function onboarding(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "POST") {
        // Get the params from the request
        const { promoCode }: { promoCode: string } = req.body;

        // Verify the promo code is given
        if (!promoCode) {
            return res
                .status(400)
                .end("Promo code to onboard account for is required");
        }

        // Initialize the affiliate
        await initializeAffiliate(promoCode);

        // Return the affiliate link
        return res.status(200).end("Successfully initialized affiliate");
    } else if (req.method === "DELETE") {
        // Get the params from the request
        const { password, promoCode }: { password: string; promoCode: string } =
            req.body;

        // Verify the params are given
        if (!password || !promoCode) {
            return res.status(400).end("Missing parameter");
        }

        // Verify the password
        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(403).end("Invalid password");
        }

        // Delete the affiliate
        await deleteAffiliate(promoCode);

        // Return success
        return res.status(200).end("Successfully disabled affiliate");
    } else {
        res.status(400).end("Invalid method");
    }
}
