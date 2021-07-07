import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "../../../utils/connectMongo";
import Joi from "joi";
import bcrypt from "bcrypt";
import AffiliateSchema from "../../../mongooseModels/affiliate";
import { stripe } from "../../../utils/stripe";
import { siteURL } from "../../../utils/constants";

export interface OnboardParams {
    affiliateID: string;
    password: string;
}

export default async function onboarding(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "POST") {
        // Pass the correct password and then redirect to the dashboard

        // Initialize the database
        await connectMongo();

        // Get the params from the request
        const { affiliateID, password }: OnboardParams = req.body;

        // Make sure the params are specified
        if (!affiliateID || !password) {
            return res.status(400).end("Missing parameter");
        }

        // Get the affiliate
        const affiliate = await AffiliateSchema.findOne({ affiliateID });
        if (!affiliate) {
            return res.status(400).end("Invalid affiliate ID");
        }

        // Compare the passwords and return error if they dont match
        const passwordsMatch = await bcrypt.compare(
            password,
            affiliate.password as string
        );
        if (!passwordsMatch) {
            return res.status(403).end("Invalid password");
        }

        // Create a dashboard link
        const dashboardLink = await stripe.accounts.createLoginLink(
            affiliate.accountID
        );

        // Return the dashboard link
        res.status(200).end(dashboardLink.url);
    } else if (req.method === "PATCH") {
        // *********** Maybe we should have the password created ONCE and then refer back to that password
        // Make some sort of first time password - check if the password is null - if it is then it should be modified, else it should be checked
        // Change the calling route to say (new password if you havent entered a password before)

        // Update the specified password and redirect them to an onbording link

        // Get the params from the request
        const { affiliateID, password }: OnboardParams = req.body;

        // Make sure the params are specified
        if (!affiliateID || !password) {
            return res.status(400).end("Missing parameter");
        }

        // Verify the users password against a schema
        const passwordSchema = Joi.object({
            password: Joi.string().required().min(8).max(30),
        });
        const { error } = passwordSchema.validate({ password });
        if (error) {
            return res.status(400).end(error.details[0].message);
        }

        // Get the affiliate
        const affiliate = await AffiliateSchema.findOne({ affiliateID });
        if (!affiliate) {
            return res.status(400).end("No affiliate with that affiliate ID");
        }

        // Now verify that the affiliate is not verified
        const detailsSubmitted = (
            await stripe.accounts.retrieve(affiliate.accountID)
        ).details_submitted;
        if (detailsSubmitted) {
            return res
                .status(400)
                .end("Details have already been submitted for this affiliate");
        }

        // Hash the password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        // Store the password in the database
        await AffiliateSchema.updateOne(
            { affiliateID },
            { $set: { password: hashedPassword } }
        );

        // Create an onboarding link for the affiliate
        const onboardingLink = await stripe.accountLinks.create({
            account: affiliate.accountID,
            type: "account_onboarding",
            refresh_url: `${siteURL}/affiliate/portal/${affiliateID}`,
            return_url: `${siteURL}/affiliate/portal`,
        });

        // Return the onboarding link
        res.status(200).end(onboardingLink.url);
    }
}
