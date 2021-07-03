import { MAX_QUANTITY } from "../utils/constants";
import { CartItem } from "../components/layout";
import { createContext, Dispatch, SetStateAction } from "react";

// Shopping cart context
export const cartContext = createContext<
    [CartItem[], Dispatch<SetStateAction<CartItem[]>>]
>(undefined as any);

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
                // Save the cart in the local storage
                localStorage.setItem("cart", JSON.stringify(cart));
                setCart(newCart);
                return true;
            } else {
                // Save the cart in the local storage
                localStorage.setItem("cart", JSON.stringify(cart));
                setCart(newCart.splice(i, 1));
                return true;
            }
        }
    }

    // Otherwise return failure
    return false;
};

// Check if an item exists in the card
export const itemInCart = (costID: string, cart: CartItem[]) => {
    // Check the items and return the index the item exists at
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].costID === costID) return i;
    }

    // Return -1 if the item does not exist
    return -1;
};
