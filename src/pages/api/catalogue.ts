import { NextApiRequest, NextApiResponse } from "next";
import { getCatalogue } from "../../utils/stripe";

export default async function onboarding(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "GET") {
        // Get the list of items from the catalogue
        const catalogue = await getCatalogue();

        // Return the catalogue
        res.status(200).json(catalogue);
    } else {
        res.status(400).end("Invalid method");
    }
}
