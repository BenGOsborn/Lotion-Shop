import { GetServerSideProps, NextPage } from "next";
import { stripe } from "../../../utils/stripe";
import connectMongo from "../../../utils/connectMongo";
import AffiliateSchema from "../../../mongooseModels/affiliate";
import { useEffect } from "react";
import { useRouter } from "next/dist/client/router";
import axios, { AxiosError } from "axios";
import { OnboardParams } from "../../api/affiliate";

interface Props {
    redirect: boolean;
    affiliateID?: string;
}

const Onboarding: NextPage<Props> = ({ redirect, affiliateID }) => {
    const router = useRouter();

    // Get the params
    useEffect(() => {
        if (!redirect) {
            // Get the password
            const password = prompt(
                `Create a password for affiliate with ID '${affiliateID}'`
            );

            // Get the onboarding link and redirect to it
            axios
                .patch<string>("/api/affiliate", {
                    affiliateID,
                    password,
                } as OnboardParams)
                .then((result) => {
                    // Redirect to the onboarding URL
                    router.push(result.data);
                })
                .catch((error: AxiosError<string>) => {
                    // Log the error message and reload the page
                    alert(error.response?.data);
                    router.reload();
                });
        }
    }, []);

    return null;
};

export const getServerSideProps: GetServerSideProps = async ({
    res,
    params,
}) => {
    // Connect to the database
    await connectMongo();

    // Get the affiliate id from the request
    const affiliateID: string = (params as any).affiliateID;

    // Attempt to get the affiliate
    const affiliate = await AffiliateSchema.findOne({ affiliateID });
    if (!affiliate) {
        // Invalid affiliate id - redirect to home page
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
            // User will be prompted to make a password
            return {
                props: {
                    redirect: false,
                    affiliateID,
                } as Props,
            };
        }
    }
};

// Export the component
export default Onboarding;
