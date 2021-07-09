import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import axios from "axios";

export default async function hookSubscribe(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Webhook endpoint for Stripe checkout.session.completed

    // Get the params from the webhook
    // ***** I need to turn this object into a stripe checkout object
    const {
        data: { object },
    }: { data: { object: Stripe.Checkout.Session } } = req.body;

    // Only activate on the correct sent object
    if (object.object !== "checkout.session") {
        return res.status(400).end("Invalid object");
    }

    // Make the request
    await axios.post<any>(
        `https://${process.env.MAILCHIMP_REGION}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_LIST_ID}`,
        {
            members: [
                {
                    email_address: object.customer_details?.email,
                    status: "subscribed",
                },
            ],
        },
        {
            headers: {
                Authorization: `auth ${process.env.MAILCHIMP_API_KEY}`,
            },
        }
    );

    // Return success
    return res.status(200).end("Success");
}
