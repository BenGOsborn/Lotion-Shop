import { NextPage } from "next";
import { useEffect } from "react";
import { useRouter } from "next/dist/client/router";
import axios, { AxiosError } from "axios";
import { OnboardParams } from "../../api/affiliate";

interface Props {}

const Portal: NextPage<Props> = () => {
    const router = useRouter();

    useEffect(() => {
        // Get the affiliate ID
        const affiliateID = prompt(
            "Enter your affiliate ID (found on the end of your onboarding link)"
        );

        // Get the password
        const password = prompt("Enter your password");

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

    return null;
};

export default Portal;
