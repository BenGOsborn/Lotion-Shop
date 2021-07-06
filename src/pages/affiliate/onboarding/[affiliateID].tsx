import { GetServerSideProps, NextPage } from "next";
import { onboardAffiliate } from "../../../utils/affiliates";

interface Props {}

const Onboarding: NextPage<Props> = () => {
    return null;
};

export const getServerSideProps: GetServerSideProps = async ({
    res,
    params,
}) => {
    // Get the affiliate id from the request
    const affiliateID: string = (params as any).affiliateID;

    // Create an onboarding link for the user and redirect them to the onboard or otherwise just redirect them to the home screen
    let redirectURL: string;
    try {
        redirectURL = await onboardAffiliate(affiliateID);
    } catch {
        redirectURL = "/"; // Maybe I want a better error message page ? (dont redirect, just return an error page)
    }

    // ******* Provide some way of an affiliate viewing their account detials (maybe create that login portal) + https://stripe.com/docs/connect/express-dashboard
    // Also look into rejecting accounts vs deleting them

    // Redirect the user
    res.statusCode = 302;
    res.setHeader("Location", redirectURL);

    // Redirect at the end here too to the landing page
    return { props: {} as Props };
};

// Export the component
export default Onboarding;
