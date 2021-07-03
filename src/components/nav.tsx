import { useContext } from "react";
import { cartContext } from "../utils/cart";

const Nav = () => {
    // Initialize the context
    const [cart] = useContext(cartContext);

    return <p>Items in cart: {cart.length}</p>;
};

// Export the nav
export default Nav;
