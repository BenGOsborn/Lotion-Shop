import { NextApiRequest, NextApiResponse } from "next";
import { createCheckoutSession } from "../../utils/stripe";

export default async function catalogue(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "GET") {
        const checkoutURL = await createCheckoutSession();

        res.status(200).end(checkoutURL);
    } else {
        res.status(400).end("Invalid method");
    }
}
