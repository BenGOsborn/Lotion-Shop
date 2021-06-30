import { NextApiRequest, NextApiResponse } from "next";
import { getCatalogue } from "../../utils/stripe";

export default async function catalogue(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "GET") {
        // Get a list of items
        const items = await getCatalogue();

        // Return the items
        res.status(200).json(items);
    } else {
        res.status(400).end("Invalid method");
    }
}
