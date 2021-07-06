import { NextApiRequest, NextApiResponse } from "next";
import AffiliateSchema from "../../../mongooseModels/affiliate";
import connectMongo from "../../../utils/connectMongo";
import { stripe } from "../../../utils/stripe";

export default async function admin(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        // Get the params from the request
        const { affiliateID }: { affiliateID: string } = req.body;

        // Verify the affiliate ID is given
        if (!affiliateID) {
            return res.status(400).end("Affiliate ID is required");
        }

        // Initialize the database
        await connectMongo();

        // Make sure the affiliate ID does not already exist
        const affiliate = await AffiliateSchema.findOne({ affiliateID });
        if (affiliate) {
            return res.status(400).end("Affiliate with this promo code exists");
        }

        // Create a new account
        const accountID = (await stripe.accounts.create({ type: "express" }))
            .id;

        // Create a new affiliate and save in the database
        await AffiliateSchema.create({ affiliateID, accountID });

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

        // Initialize the database
        await connectMongo();

        // Here we want to get the database entry of the affiliate
        const affiliate = await AffiliateSchema.findOne({ affiliateID });
        if (!affiliate) {
            return res
                .status(400)
                .end("No existing affiliate with this affiliate ID");
        }

        // Reject the users stripe account, and delete the database entry
        const rejectAcc = stripe.accounts.reject(affiliate.accountID, {
            reason: "other",
        });
        const deleteAffiliate = AffiliateSchema.deleteOne({ affiliateID });

        // Wait for the promises
        await Promise.all([rejectAcc, deleteAffiliate]);

        // Return success
        return res.status(200).end("Successfully deleted affiliate");
    } else {
        res.status(400).end("Invalid method");
    }
}
