import { useEffect, useContext, Dispatch, SetStateAction } from "react";
import { cartContext } from "../utils/contexts";
import { CartItem } from "./layout";
import { MAX_QUANTITY } from "../utils/constants"; // This is breaking stuff by calling a mongo connect but WHY

// Add items to the shopping cart
export const addToCart = (
    costID: string,
    cart: CartItem[],
    setCart: Dispatch<SetStateAction<CartItem[]>>
) => {
    // Make a copy of the cart to be modified
    const newCart = [...cart];

    // Used to track if the specified product to update was found or not
    let updatedIndex = -1;

    // Update the quantity of the items if it exists
    for (let i = 0; i < newCart.length; i++) {
        if (newCart[i].costID === costID) {
            // Make sure the amount in the cart is not more than what is allowed (verified on the backend too)
            if (newCart[i].quantity === MAX_QUANTITY) return false;
            newCart[i].quantity++;
            updatedIndex = i;
            break;
        }
    }

    // Add the item to the card if it does not exist
    if (updatedIndex === -1) {
        newCart.push({ costID, quantity: 1 });
    }

    // Update the cart
    setCart(newCart);

    // Return success
    return true;
};

// Remove items from the shopping cart
export const removeFromCart = (
    costID: string,
    cart: CartItem[],
    setCart: Dispatch<SetStateAction<CartItem[]>>
) => {
    // Make a copy of the cart to be modified
    const newCart = [...cart];

    // Update the quantity of items if the item exists
    for (let i = 0; i < newCart.length; i++) {
        if (newCart[i].costID === costID) {
            // If the quantity is 1 then delete the item from the cart, otherwise decrement the value
            if (newCart[i].quantity > 1) {
                newCart[i].quantity--;
                setCart(newCart);
                return true;
            } else {
                setCart(newCart.splice(i, 1));
                return true;
            }
        }
    }

    // Otherwise return failure
    return false;
};

// Please add typescript to this for the states and such

const Nav = () => {
    const [cart, setCart] = useContext(cartContext as any);

    useEffect(() => {
        // Update the local storage whenever the cart is changed
        const localCart = localStorage.getItem("cart");
        if (localCart) {
            setCart(JSON.parse(localCart) as CartItem[]);
        }
    }, []);

    // ******** Is having this here prone to bugs or is it good practice ?
    useEffect(() => {
        // Save the cart in the local storage
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    return <div>Hello world</div>;
};

// Export the nav
export default Nav;
