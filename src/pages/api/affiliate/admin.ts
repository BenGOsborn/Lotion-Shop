import { NextApiRequest, NextApiResponse } from "next";
import {
    initializeAffiliate,
    deleteAffiliate,
} from "../../../utils/affiliates";

export default async function admin(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        // Get the params from the request
        const { affiliateID }: { affiliateID: string } = req.body;

        // Verify the affiliate ID is given
        if (!affiliateID) {
            return res.status(400).end("Affiliate ID is required");
        }

        // Initialize the affiliate
        await initializeAffiliate(affiliateID);

        // Return the affiliate link
        return res.status(200).end("Successfully initialized affiliate");
    } else if (req.method === "DELETE") {
        // Get the params from the request
        const {
            password,
            affiliateID,
        }: { password: string; affiliateID: string } = req.body;

        // Verify the params are given
        if (!password || !affiliateID) {
            return res.status(400).end("Missing parameter");
        }

        // Verify the password
        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(403).end("Invalid password");
        }

        // Delete the affiliate
        await deleteAffiliate(affiliateID);

        // Return success
        return res.status(200).end("Successfully deleted affiliate");
    } else {
        res.status(400).end("Invalid method");
    }
}
