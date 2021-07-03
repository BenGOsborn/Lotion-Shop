import { useContext, useEffect, useState } from "react";
import { cartContext } from "../utils/cart";

const Nav = () => {
    // Initialize the context
    const [cart] = useContext(cartContext);

    // The state of the total amount of items
    const [total, setTotal] = useState<number>(0);

    useEffect(() => {
        // Get the new total
        let newTotal = 0;
        cart.forEach((item) => (newTotal += item.quantity));

        // Set it in the state
        setTotal(newTotal);
    }, [cart]);

    return <p>Items in cart: {total}</p>;
};

// Export the nav
export default Nav;
