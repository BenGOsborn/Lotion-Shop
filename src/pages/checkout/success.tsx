// If there is no success, redirect to the checkout page

import { GetServerSideProps, NextPage } from "next";
import { useContext, useEffect } from "react";
import { cartContext, clearCart } from "../../utils/cart";
import Link from "next/link";
import { stripe } from "../../utils/stripe";
import styles from "../../styles/Success.module.scss";

interface Props {
    receiptURL: string;
}

const Success: NextPage<Props> = ({ receiptURL }) => {
    // Initialize the context
    const [cart, setCart] = useContext(cartContext);

    // We should also clear the cart if this page loads
    useEffect(() => {
        clearCart(setCart);
    }, []);

    return (
        <div className={styles.success}>
            <p>
                Success! You can find your receipt{" "}
                <a href={receiptURL} target="_blank">
                    here
                </a>
                .
            </p>
            <Link href="/">Continue shopping</Link>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
    // Get the cookies
    const { checkoutID }: { checkoutID?: string } = req.cookies;

    // Check if there is a checkout ID - if there is not, then get rid of it
    if (typeof checkoutID === "undefined") {
        // Redirect the user to the checkout page
        res.statusCode = 302;
        res.setHeader("Location", "/checkout");

        // Return something
        return { props: {} as any };
    }

    try {
        // Get the checkout
        const checkoutSession = await stripe.checkout.sessions.retrieve(
            checkoutID
        );

        // Get the payment intent from the session
        const paymentIntentID = checkoutSession.payment_intent;
        const paymentIntent = await stripe.paymentIntents.retrieve(
            paymentIntentID as string
        );

        // Get the url of the receipt and return it
        const receipt = paymentIntent.charges.data[0].receipt_url;

        // Pass the receipt through
        return { props: { receiptURL: receipt } as Props };
    } catch {
        // Redirect the user to the checkout
        res.statusCode = 302;
        res.setHeader("Location", "/checkout");

        // Return something
        return { props: {} as any };
    }
};

export default Success;
