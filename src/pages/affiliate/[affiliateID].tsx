import { GetServerSideProps, NextPage } from "next";
import cookie from "cookie";
import connectMongo from "../../utils/connectMongo";
import AffiliateSchema from "../../mongooseModels/affiliate";
import { stripe } from "../../utils/stripe";

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

    // Initialize database
    connectMongo();

    // Get the affiliate with the specified ID
    const affiliate = await AffiliateSchema.findOne({ affiliateID });
    if (affiliate) {
        // Check if the affiliates details are submitted and set the cookie if they are
        const account = await stripe.accounts.retrieve(affiliate.accountID);
        if (account.details_submitted) {
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
    }

    // Redirect to the landing page
    res.statusCode = 302;
    res.setHeader("Location", "/");

    // Pass something to the props
    return { props: {} as Props };
};

// Export the component
export default Affiliate;
