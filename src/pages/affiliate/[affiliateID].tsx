import { GetServerSideProps, NextPage } from "next";
import cookie from "cookie";
import { affiliateIDExists } from "../../utils/affiliates";

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

    // Look up that user and set a cookie
    const validAffiliate = await affiliateIDExists(affiliateID);
    if (validAffiliate) {
        res.setHeader(
            "Set-Cookie",
            cookie.serialize("affiliateID", affiliateID, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development",
                maxAge: 60 * 60 * 24 * 7, // Have the referrer bonus last for 1 week
                sameSite: "strict",
                path: "/",
            })
        );
    }

    // Redirect to the landing page
    res.statusCode = 302;
    res.setHeader("Location", "/");

    // Pass something to the props
    return { props: {} as Props };
};

// Export the component
export default Affiliate;
