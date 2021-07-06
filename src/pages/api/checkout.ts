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
        const { items }: { items: CartItem[] } = req.body;

        // Get the cookies
        const {
            customerID,
            affiliateID,
        }: { customerID?: string; affiliateID?: string } = req.cookies;

        // Check that the priceIDs exist
        if (typeof items === "undefined" || items.length === 0) {
            throw new Error("Missing cost IDs");
        }

        try {
            // Create the checkout link
            const checkoutData = await createCheckoutSession(
                items,
                customerID,
                affiliateID
            );

            // Set the customer ID cookie, the checkout session ID cookie, and delete the affiliate ID cookie
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
                cookie.serialize("affiliateID", "", {
                    httpOnly: true,
                    secure: process.env.NODE_ENV !== "development",
                    maxAge: 0,
                    sameSite: "strict",
                    path: "/",
                }),
            ]);

            // Return the checkout link
            res.status(200).end(checkoutData.url);
        } catch (e) {
            // Delete the affiliate cookie
            res.setHeader(
                "Set-Cookie",
                cookie.serialize("affiliateID", "", {
                    httpOnly: true,
                    secure: process.env.NODE_ENV !== "development",
                    maxAge: 0,
                    sameSite: "strict",
                    path: "/",
                })
            );

            // Return error
            res.status(500).end(e.toString());
        }
    } else {
        res.status(400).end("Invalid method");
    }
}
