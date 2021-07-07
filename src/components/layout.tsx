import { FC, useEffect, useState } from "react";
import Nav from "./nav";
import { cartContext } from "../utils/cart";
import Display from "./display";

export interface CartItem {
    priceID: string;
    quantity: number;
}

const Layout: FC<{}> = ({ children }) => {
    // The state of the cart to be used across components
    const [cart, setCart] = useState<CartItem[]>([]);

    // Set the context to whatever is inside the local storage
    useEffect(() => {
        const localCart = localStorage.getItem("cart");
        if (localCart) {
            // Parse the items from their string form and store them in the state
            setCart(JSON.parse(localCart));
        }
    }, []);

    return (
        <>
            <cartContext.Provider value={[cart, setCart]}>
                <Nav />
                <main>{children}</main>
                <Display />
            </cartContext.Provider>
        </>
    );
};

// Export the component
export default Layout;
