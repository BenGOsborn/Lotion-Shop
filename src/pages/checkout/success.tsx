// If there is no success, redirect to the checkout page

import { GetServerSideProps, NextPage } from "next";
import { useContext, useEffect } from "react";
import { cartContext, clearCart } from "../../utils/cart";
import { retrieveReceipt } from "../../utils/stripe";

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
        <h1>
            Hello world. Your receipt is{" "}
            <a href={receiptURL} target="_blank">
                {receiptURL}
            </a>
        </h1>
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

    // ********* Maybe it is not loading in time ?

    try {
        // Get and pass the receipt as a prop
        const receipt = await retrieveReceipt(checkoutID);

        return { props: { receiptURL: receipt } as Props };
    } catch {
        // Redirect the user to the checkout
        res.statusCode = 302;
        res.setHeader("Location", "/");

        // Return something
        return { props: {} as any };
    }
};

export default Success;
