import { GetServerSideProps, NextPage } from "next";
import cookie from "cookie";
import { promoCodeExists } from "../../utils/affiliates";

interface Props {}

const Affiliate: NextPage<Props> = () => {
    return null;
};

export const getServerSideProps: GetServerSideProps = async ({
    res,
    params,
}) => {
    // Get the affiliate id from the request
    const affiliateID: string = (params as any).affiliateID;

    // Look up that user and set a cookie, then redirect
    const validAffiliate = await promoCodeExists(affiliateID);
    if (validAffiliate) {
        res.setHeader(
            "Set-Cookie",
            cookie.serialize("affiliateID", affiliateID, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development",
                maxAge: 60 * 60 * 24 * 5, // Have the code last for 5 days
                sameSite: "strict",
                path: "/",
            })
        );
    }

    // Redirect at the end here too to the landing page
    res.statusCode = 302;
    res.setHeader("Location", "/");

    // Pass something to the props
    return { props: {} as Props };
};

// Export the component
export default Affiliate;
