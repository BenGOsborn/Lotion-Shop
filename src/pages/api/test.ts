import { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "../../utils/stripe";
import connectMongo from "../../utils/connectMongo";
import { siteURL } from "../../utils/constants";

export default async function test(req: NextApiRequest, res: NextApiResponse) {
    // Make sure this request is not accessed on production
    if (process.env.NODE_ENV !== "production") {
        // Connect to the database
        await connectMongo();

        const response = await stripe.accountLinks.create({
            account: "acct_1JASeK2ErEr1UnWL",
            type: "account_onboarding",
            refresh_url: `${siteURL}/affiliate/portal`,
            return_url: `${siteURL}/affiliate/portal`,
        });

        // Send the response
        return res.status(200).json(response);
    } else {
        return res.status(403).end("This route is disabled");
    }
}
