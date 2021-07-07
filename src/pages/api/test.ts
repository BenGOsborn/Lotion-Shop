import { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "../../utils/stripe";
import connectMongo from "../../utils/connectMongo";

export default async function test(req: NextApiRequest, res: NextApiResponse) {
    // Make sure this request is not accessed on production
    if (process.env.NODE_ENV !== "production") {
        // Connect to the database
        await connectMongo();

        const response = await stripe.accounts.retrieve(
            "acct_1JA14s2EwG5uxF7G"
        );

        // Send the response
        return res.status(200).json(response);
    } else {
        return res.status(403).end("This route is disabled");
    }
}
