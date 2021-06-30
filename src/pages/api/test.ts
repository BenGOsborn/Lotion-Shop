import { NextApiRequest, NextApiResponse } from "next";
import { referralHook, connectCustomer } from "../../utils/stripe";

export default async function hooks(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        const response = await connectCustomer();

        res.status(200).json(response);
    } else {
        res.status(400).end("Invalid method");
    }
}
