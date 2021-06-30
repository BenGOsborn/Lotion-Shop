import { NextApiRequest, NextApiResponse } from "next";
import { referralHook } from "../../utils/stripe";

export default async function hooks(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        const response = await referralHook();

        res.status(200).json(response);
    } else {
        res.status(400).end("Invalid method");
    }
}
