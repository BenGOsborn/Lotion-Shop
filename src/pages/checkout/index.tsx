// This page is going to display the items in the checkout and allow the person to gather more if they wish
// Make sure to get the payment intent before proceeding to the checkout and storing it so the user can view their receipt

import { NextPage } from "next";
import { useContext } from "react";
import { cartContext } from "../../utils/cart";

interface Props {}

// This should have another one of those check item useEffects on it

const Checkout: NextPage<Props> = () => {
    // Initialize the context
    const [cart, setCart] = useContext(cartContext);

    return <div>Checkout</div>;
};

export default Checkout;
