import { NextPage } from "next";
import { useEffect } from "react";
import { useRouter } from "next/dist/client/router";
import axios, { AxiosError } from "axios";
import { OnboardParams } from "../../api/affiliate";
import Head from "next/head";

interface Props {}

const Portal: NextPage<Props> = () => {
    const router = useRouter();

    useEffect(() => {
        // Get the affiliate ID and exit if not given
        const affiliateID = prompt(
            "Enter your affiliate ID (found on the end of your onboarding link)"
        );
        if (!affiliateID) {
            router.push("/");
            return;
        }

        // Get the password and exit if not given
        const password = prompt("Enter your password");
        if (!password) {
            router.push("/");
            return;
        }

        // Make a request to the API to get the dashboard link
        axios
            .post<string>("/api/affiliate", {
                affiliateID,
                password,
            } as OnboardParams)
            .then((result) => {
                // Redirect to the link
                router.push(result.data);
            })
            .catch((error: AxiosError<string>) => {
                // Log the error message and reload the page
                alert(error.response?.data);
                router.reload();
            });
    }, []);

    return (
        <Head>
            <meta name="robots" content="noindex, nofollow" />
        </Head>
    );
};

export default Portal;
