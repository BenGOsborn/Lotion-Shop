import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { payReferrer } from "../../utils/stripe";

export default async function hook(req: NextApiRequest, res: NextApiResponse) {
    console.log(req.method);

    // Add types to this
    const rawHookData = req.body.data.object;
    const hookType: string = rawHookData.object;

    // Define the types of callbacks
    if (hookType === "discount") {
        // Convert the data to the right type
        const hookData: Stripe.Discount = rawHookData;

        // Extract the data from the
        const promoCodeID = hookData.promotion_code;
        const checkoutSessionID = hookData.checkout_session;

        // Verify that the parameters are defined
        if (!promoCodeID || !checkoutSessionID) {
            return res.status(400).end("Missing a parameter");
        }

        // Transfer the funds to the referrer
        await payReferrer(promoCodeID, checkoutSessionID);
    }

    return res.status(200).end("Done");
}
