import { NextApiRequest, NextApiResponse } from "next";
import { CartItem } from "../../components/layout";
import { createCheckoutSession } from "../../utils/stripe";
import cookie from "cookie";

export default async function catalogue(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "POST") {
        // Get the data from the request
        const { items }: { items: CartItem[] } = req.body; // More like some of these will be sent as cookies

        // Get the cookies - ******* MAKE SURE THE CUSTOMER COOKIE CANNOT BE EXPLOITED FOR PURCHASES
        const {
            customerID,
            promoCode,
        }: { customerID?: string; promoCode?: string } = req.cookies;

        // Check that the priceIDs exist
        if (typeof items === "undefined" || items.length === 0) {
            throw new Error("Missing cost IDs");
        }

        // Create the checkout link
        const checkoutData = await createCheckoutSession(
            items,
            customerID,
            promoCode
        );

        // Set the customer ID cookie and the checkout session ID cookie
        res.setHeader("Set-Cookie", [
            cookie.serialize("customerID", checkoutData.customerID, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development",
                maxAge: 60 * 60 * 24 * 365 * 100,
                sameSite: "strict",
                path: "/",
            }),
            cookie.serialize("checkoutID", checkoutData.checkoutID, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development",
                maxAge: 60 * 60 * 24,
                sameSite: "lax", // Required so the cookie can be accessed from the Stripe redirect
                path: "/",
            }),
        ]);

        // Return the checkout link
        res.status(200).end(checkoutData.url);
    } else {
        res.status(400).end("Invalid method");
    }
}
