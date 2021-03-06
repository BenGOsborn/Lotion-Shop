import { FC, useContext, useEffect, useState } from "react";
import { cartContext } from "../utils/cart";
import Link from "next/link";
import styles from "../styles/Nav.module.scss";

const Nav: FC<{}> = () => {
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
        <nav className={styles.nav}>
            <Link href="/">
                <a>
                    <h1>Lotion Shop</h1>
                </a>
            </Link>

            {/* Once there are more items in the shop, create a new web page with the full catalogue FROM the home page, and replace the one on the homepage with the product banner */}
            <ul>
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
