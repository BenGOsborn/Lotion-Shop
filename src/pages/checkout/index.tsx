// This page is going to display the items in the checkout and allow the person to gather more if they wish
// Make sure to get the payment intent before proceeding to the checkout and storing it so the user can view their receipt

import axios, { AxiosError } from "axios";
import { NextPage } from "next";
import { MouseEvent, useContext, useEffect, useState } from "react";
import { addToCart, cartContext, removeFromCart } from "../../utils/cart";
import { CatalogueItem } from "../../utils/stripe";
import { useRouter } from "next/dist/client/router";

interface Props {}

interface CheckoutItems {
    name: string;
    quantity: number;
    price: number;
    priceID: string;
}

export interface Status {
    success: boolean;
    log: any;
}

// I should include some sort of upsells before the user redirects to the checkout process - maybe I can have it display special offers that arent normally shown ? OR offer a discount on a bulk buy ?

const Checkout: NextPage<Props> = () => {
    // Initialize the context
    const [cart, setCart] = useContext(cartContext);

    // Initialize the states
    const [checkoutItems, setCheckoutItems] = useState<CheckoutItems[]>([]);
    const [status, setStatus] = useState<Status | null>(null);

    const router = useRouter();

    // Update the checkout items
    useEffect(() => {
        axios
            .get<CatalogueItem[]>("/api/catalogue")
            .then((res) => {
                // Make a new list of checkout items from the cart
                const newCheckoutItems: CheckoutItems[] = [];

                const priceIDs = cart.map((item) => item.priceID);
                const tuples = cart.map((item) => [
                    item.priceID,
                    item.quantity,
                ]);

                res.data.forEach((item) => {
                    if (priceIDs.includes(item.price.id)) {
                        const index = priceIDs.indexOf(item.price.id);
                        newCheckoutItems.push({
                            name: item.product.name,
                            quantity: tuples[index][1] as number,
                            price: item.price.unit_amount as number,
                            priceID: item.price.id,
                        });
                    }
                });

                setCheckoutItems(newCheckoutItems);
            })
            .catch((error: AxiosError) => {
                // Log an error message
                setStatus({ success: false, log: error.response?.data });
            });
    }, [cart]);

    const onCheckout = (e: MouseEvent<HTMLAnchorElement>) => {
        // Prevent the page from executing navigation
        e.preventDefault();

        // Get the checkout link (contains cookies) and set the cookies it gets from them
        axios
            .post<string>("/api/checkout", { items: cart })
            .then((res) => {
                // The cookies should be set from the response - redirect to the checkout URL
                router.push(res.data);
            })
            .catch((error: AxiosError) => {
                // Log the error message
                setStatus({ success: false, log: error.response?.data });
            });
    };

    // Now here I want to provide a layout of all of the different items and adjustments for them

    return (
        <>
            {checkoutItems.length > 0 ? (
                <>
                    <table>
                        <thead>
                            <tr>
                                <td>Name</td>
                                <td>Quantity</td>
                                <td>Price Per Item</td>
                                <td>Price</td>
                            </tr>
                        </thead>
                        <tbody>
                            {checkoutItems.map((item, index) => {
                                return (
                                    <tr key={index}>
                                        <td>{item.name}</td>
                                        <td>
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    removeFromCart(
                                                        item.priceID,
                                                        cart,
                                                        setCart
                                                    );
                                                }}
                                            >
                                                -
                                            </a>
                                            <span>{item.quantity}</span>
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    addToCart(
                                                        item.priceID,
                                                        cart,
                                                        setCart
                                                    );
                                                }}
                                            >
                                                +
                                            </a>
                                        </td>
                                        <td>
                                            ${(item.price / 100).toFixed(2)}
                                        </td>
                                        <td>
                                            $
                                            {(
                                                (item.price * item.quantity) /
                                                100
                                            ).toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr>
                                <td>Total</td>
                                <td>
                                    {checkoutItems.reduce(
                                        (accumulator, current) =>
                                            accumulator + current.quantity,
                                        0
                                    )}
                                </td>
                                <td></td>
                                <td>
                                    $
                                    {(
                                        checkoutItems.reduce(
                                            (accumulator, current) =>
                                                accumulator +
                                                current.price *
                                                    current.quantity,
                                            0
                                        ) / 100
                                    ).toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <a href="#" onClick={onCheckout}>
                        Checkout
                    </a>
                </>
            ) : null}
            {status ? (
                status.success ? (
                    <p>{status.log}</p>
                ) : (
                    <p>{status.log}</p>
                )
            ) : null}
        </>
    );
};

export default Checkout;
