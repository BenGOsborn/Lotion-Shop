import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import axios, { AxiosError } from "axios";

export default async function catalogue(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // // Get the params from the webhook
    // const { object }: { object: Stripe.Checkout.Session | undefined } =
    //     req.body;

    // // Only activate on the correct sent object
    // if (object?.object !== "checkout.session") {
    //     return res.status(400).end("Invalid object");
    // }

    // Make the request
    const response = await axios.post<any>(
        `https://${process.env.MAILCHIMP_REGION}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_LIST_ID}`,
        {
            members: [
                {
                    // email_address: object.customer_details?.email,
                    email_address: "hello@world.com",
                    status: "subscribe",
                },
            ],
        },
        { headers: { Authorization: `auth ${process.env.MAILCHIMP_API_KEY}` } }
    );

    // Return success
    return res.status(200).json(response.data);
}
