import { NextApiRequest, NextApiResponse } from "next";
import { connectCustomer } from "../../utils/stripe";

export default async function addAffiliate(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "GET") {
        const response = await connectCustomer();

        res.status(200).json(response);
    } else {
        res.status(400).end("Invalid method");
    }
}
