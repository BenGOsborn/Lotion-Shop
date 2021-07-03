// This page is going to display the items in the checkout and allow the person to gather more if they wish
// Make sure to get the payment intent before proceeding to the checkout and storing it so the user can view their receipt

import axios from "axios";
import { NextPage } from "next";
import { useContext, useEffect, useState } from "react";
import { cartContext } from "../../utils/cart";
import { CatalogueItem } from "../../utils/stripe";

interface Props {}

interface CheckoutItems {
    name: string;
    quantity: number;
    price: number;
}

// I should include some sort of upsells before the user redirects to the checkout process - maybe I can have it display special offers that arent normally shown ? OR offer a discount on a bulk buy ?

const Checkout: NextPage<Props> = () => {
    // Initialize the context
    const [cart, setCart] = useContext(cartContext);
    const [checkoutItems, setCheckoutItems] = useState<CheckoutItems[]>([]);

    // Filter the invalid items out of the checkout items
    useEffect(() => {
        // Get the full catalogue of items
        axios
            .get<CatalogueItem[]>("/api/catalogue")
            .then((res) => {
                // Get a list of valid price ids from the catalogue
                const validPriceIDs = res.data.map((item) => item.price.id);

                // Filter out the cart items not in the catalogue and set that as the state
                const filtered = cart.filter((item) =>
                    validPriceIDs.includes(item.priceID)
                );

                // Update the local storage and the cart
                localStorage.setItem("cart", JSON.stringify(filtered));
                setCart(filtered);

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
                        });
                    }
                });

                setCheckoutItems(newCheckoutItems); // This has not been initialized yet
            })
            .catch(() => null); // What am I gonna do about the checkout items here ? (error message)

        // I also need some way of loading in the price of each of the items ?
    }, []);

    // Now here I want to provide a layout of all of the different items and adjustments for them

    return (
        <>
            <table>
                <thead>
                    <tr>
                        <td>Name</td>
                        <td>Quantity</td>
                        <td>Price</td>
                    </tr>
                </thead>
                <tbody>
                    {checkoutItems.map((item) => {
                        return (
                            <tr>
                                <td>{item.name}</td>
                                <td>{item.quantity}</td>
                                <td>${(item.price / 100).toFixed(2)}</td>
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
                        <td>
                            $
                            {(
                                checkoutItems.reduce(
                                    (accumulator, current) =>
                                        accumulator + current.price,
                                    0
                                ) / 100
                            ).toFixed(2)}{" "}
                        </td>
                    </tr>
                </tbody>
                <a href="#" onClick={(e) => console.log("LOl!")}>
                    Checkout
                </a>
            </table>
        </>
    );
};

export default Checkout;
