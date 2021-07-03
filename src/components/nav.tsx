import { useContext, useEffect, useState } from "react";
import { cartContext } from "../utils/cart";
import Link from "next/link";

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

    return (
        <nav>
            <h2>
                <Link href="/">Lotion Shop</Link>
            </h2>
            <ul>
                <li>
                    <Link href="/shop">Shop</Link>
                </li>
                <li>
                    <Link href="/checkout">{`View Cart (${
                        total === 0 ? "empty" : total
                    })`}</Link>
                </li>
            </ul>
        </nav>
    );
};

// Export the nav
export default Nav;
