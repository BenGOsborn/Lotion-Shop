import { GetServerSideProps, NextPage } from "next";
import { stripe } from "../../../utils/stripe";
import connectMongo from "../../../utils/connectMongo";
import AffiliateSchema from "../../../mongooseModels/affiliate";
import { useEffect } from "react";
import { useRouter } from "next/dist/client/router";

interface Props {
    redirect: boolean;
    affiliateID?: string;
    hasPassword?: boolean;
}

const Onboarding: NextPage<Props> = ({
    redirect,
    affiliateID,
    hasPassword,
}) => {
    const router = useRouter();

    // Conditionally render something if boolean
    useEffect(() => {
        // I want to provide a prompt, if it is closed then nothing should occur
        if (!redirect) {
            if (hasPassword) {
                const password = prompt("Enter your password");
            }
        }
    }, []);

    return null;
};

export const getServerSideProps: GetServerSideProps = async ({
    res,
    params,
}) => {
    // I might have to move some of those functions out of the utils and such (since they are only one offs)

    // This should get the affiliate ID from the param
    // It will check if the account has been onboarded yet - if it has, then redirect to the portal (server side redirect)
    // If the account has not been onboarded yet, check if the user has given a password, if they have then ask for the password then redirect them, if not then require their password twice and redirect them to onboarding
    // On a successful onboard, they will be redirected to the portal where they can log in with their details, and will then be redirected to their Stripe dashboard

    // Connect to the database
    await connectMongo();

    // Get the affiliate id from the request
    const affiliateID: string = (params as any).affiliateID;

    // Attempt to get the affiliate
    const affiliate = await AffiliateSchema.findOne({ affiliateID });
    if (!affiliate) {
        // Invalid affiliate id - redirect home
        res.statusCode = 302;
        res.setHeader("Location", "/");

        return { props: { redirect: true } as Props };
    } else {
        // Get the account and check if it has already been filled out
        const detailsSubmitted = (
            await stripe.accounts.retrieve(affiliate.accountID)
        ).details_submitted;

        if (detailsSubmitted) {
            // Redirect the user to the portal
            res.statusCode = 302;
            res.setHeader("Location", "/affiliate/portal");

            return { props: { redirect: true } as Props };
        } else {
            // Check if the users password has been specified
            if (affiliate.password === null) {
                // User will be prompted to make a password
                return {
                    props: {
                        redirect: false,
                        hasPassword: false,
                        affiliateID,
                    } as Props,
                };
            } else {
                // User will be prompted to use their password
                return {
                    props: {
                        redirect: false,
                        hasPassword: true,
                        affiliateID,
                    } as Props,
                };
            }
        }
    }
};

// Export the component
export default Onboarding;
