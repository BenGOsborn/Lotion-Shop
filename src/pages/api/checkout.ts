import { NextApiRequest, NextApiResponse } from "next";
import { CartItem } from "../../components/layout";
import { stripe } from "../../utils/stripe";
import cookie from "cookie";
import {
    MAX_QUANTITY,
    REFERRER_PORTION,
    SHIPPING_ID_NORMAL,
    siteURL,
} from "../../utils/constants";
import AffiliateSchema from "../../mongooseModels/affiliate";
import Stripe from "stripe";
import connectMongo from "../../utils/connectMongo";

export default async function catalogue(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === "POST") {
        // Get the data from the request
        const { items }: { items: CartItem[] } = req.body;

        // Get the cookies
        let {
            customerID,
            affiliateID,
        }: { customerID?: string; affiliateID?: string } = req.cookies;

        // Check that the priceIDs exist
        if (typeof items === "undefined" || items.length === 0) {
            return res.status(400).end("Missing cost IDs");
        }

        // Generate the items to be featured in the checkout
        const lineItems =
            new Array<Stripe.Checkout.SessionCreateParams.LineItem>(
                items.length
            );

        for (let i = 0; i < items.length; i++) {
            lineItems[i] = {
                price: items[i].priceID,
                quantity: Math.min(items[i].quantity, MAX_QUANTITY),
            };
        }

        // If the customer is not specified, create a new customer
        if (typeof customerID === "undefined") {
            customerID = (await stripe.customers.create()).id;
        }

        // Create the checkout session
        let checkoutSession: Stripe.Response<Stripe.Checkout.Session> | null =
            null;

        // If there is a promocode apply the discount and pay the funds to the specified account
        if (affiliateID) {
            try {
                // Connect to the database
                await connectMongo();

                // Get the affiliate with the specified affiliate id
                const affiliate = await AffiliateSchema.findOne({
                    affiliateID,
                });
                if (affiliate) {
                    // Get the total price of the items (quantities and prices)
                    let total = 0;

                    for (const item of items) {
                        const price = await stripe.prices.retrieve(
                            item.priceID
                        );
                        total += (price.unit_amount as number) * item.quantity;
                    }

                    // Get the amount to pay the affiliate
                    const payout = parseFloat(
                        (total * REFERRER_PORTION).toFixed(2)
                    );

                    // Verify that the users details are submitted
                    const account = await stripe.accounts.retrieve(
                        affiliate.accountID
                    );
                    if (account.details_submitted) {
                        // Create the checkout session with the discounts applied and the amount to pay the referrer
                        checkoutSession = await stripe.checkout.sessions.create(
                            {
                                cancel_url: `${siteURL}/checkout`,
                                success_url: `${siteURL}/checkout/success`,
                                payment_method_types: ["card"],
                                line_items: lineItems,
                                customer: customerID,
                                mode: "payment", // Later on if I want to set up subscriptions im most likely going to have to set this conditionally
                                shipping_address_collection: {
                                    allowed_countries: ["AU"],
                                },
                                shipping_rates: [SHIPPING_ID_NORMAL], // The option for there to be premium shipping options should exist later as upsells (enums of different shipping IDs)
                                allow_promotion_codes: true,
                                payment_intent_data: {
                                    transfer_data: {
                                        amount: payout,
                                        destination: affiliate.accountID,
                                    },
                                },
                            }
                        );
                    }
                }
            } catch {}
        }

        // If no session has been already created, create one with no affiliate
        if (checkoutSession === null) {
            // Create the standard checkout session
            checkoutSession = await stripe.checkout.sessions.create({
                cancel_url: `${siteURL}/checkout`,
                success_url: `${siteURL}/checkout/success`,
                payment_method_types: ["card"],
                line_items: lineItems,
                customer: customerID,
                mode: "payment", // Later on if I want to set up subscriptions im most likely going to have to set this conditionally
                shipping_address_collection: { allowed_countries: ["AU"] },
                shipping_rates: [SHIPPING_ID_NORMAL], // The option for there to be premium shipping options should exist later as upsells (enums of different shipping IDs)
                allow_promotion_codes: true,
            });
        }

        // Set the customer ID cookie, the checkout session ID cookie, and delete the affiliate ID cookie
        res.setHeader("Set-Cookie", [
            cookie.serialize("customerID", customerID, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development",
                maxAge: 60 * 60 * 24 * 365 * 100,
                sameSite: "strict",
                path: "/",
            }),
            cookie.serialize("checkoutID", checkoutSession.id, {
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
        res.status(200).end(checkoutSession.url);
    } else {
        res.status(400).end("Invalid method");
    }
}
