import { NextApiRequest, NextApiResponse } from "next";
import { testMethod } from "../../utils/stripe";

export default async function test(req: NextApiRequest, res: NextApiResponse) {
    // Make sure this request is not accessed on production
    if (process.env.NODE_ENV !== "production") {
        // Call the test method
        const response = await testMethod();

        // Send the response
        return res.status(200).json(response);
    } else {
        return res.status(403).end("This route is disabled");
    }
}
