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
    // Get the promo code from the request
    const promoCode: string = (params as any).promoCode;

    // Look up that user and set a cookie, then redirect
    const validPromoCode = await promoCodeExists(promoCode);
    if (validPromoCode) {
        res.setHeader(
            "Set-Cookie",
            cookie.serialize("promoCode", promoCode, {
                // Maybe replace with the promo code ID ?
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
    res.setHeader("Location", "/"); // **** Maybe provide some sort of notification for if a valid code is set

    // Pass something to the props
    return { props: {} as Props };
};

// Export the component
export default Affiliate;
