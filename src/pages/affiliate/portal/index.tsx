import { GetServerSideProps, NextPage } from "next";
import { stripe } from "../../../utils/stripe";
import connectMongo from "../../../utils/connectMongo";
import AffiliateSchema from "../../../mongooseModels/affiliate";
import { useEffect } from "react";
import { useRouter } from "next/dist/client/router";
import axios, { AxiosError } from "axios";
import { OnboardParams } from "../../api/affiliate";

interface Props {}

const Portal: NextPage<Props> = () => {
    const router = useRouter();

    useEffect(() => {
        // Get the details and attempt to redirect to the affiliates Stripe dashboard page

        // Get the login details and make a request
        let success = false;

        while (!success) {
            // Get the affiliate ID
            const affiliateID = prompt(
                "Enter your affiliate ID (found on the end of your onboarding link)"
            );
            if (!affiliateID) continue;

            // Get the password
            const password = prompt("Enter your password");
            if (!affiliateID) continue;

            // Make a request to the API to get the dashboard link
            axios
                .post<string>("/api/affiliate", {
                    affiliateID,
                    password,
                } as OnboardParams)
                .then((result) => {
                    // Set success
                    success = true;

                    // Redirect to the link
                    router.push(result.data);
                })
                .catch((error: AxiosError<string>) =>
                    // Log the error message
                    alert(error.response?.data)
                );
        }
    }, []);

    return null;
};
