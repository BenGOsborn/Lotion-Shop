import { useContext } from "react";
import { cartContext } from "../utils/cart";

const Nav = () => {
    // Initialize the context
    const [cart] = useContext(cartContext);

    // ******* Change the cart to display the quantity of the items as well
    return <p>Items in cart: {cart.length}</p>;
};

// Export the nav
export default Nav;
