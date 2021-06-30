import { NextApiRequest, NextApiResponse } from "next";
import { createCheckoutSession } from "../../utils/stripe";

export default async function catalogue(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "GET") {
        // Get the data from the request
        const {
            priceIDs,
            customerID,
        }: { priceIDs: string[]; customerID: string | undefined } = req.body;

        // Create the checkout link
        const checkoutURL = await createCheckoutSession(priceIDs, customerID);

        // Return the checkout link
        res.status(200).end(checkoutURL);
    } else {
        res.status(400).end("Invalid method");
    }
}
