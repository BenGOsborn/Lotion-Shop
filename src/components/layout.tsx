import { FC, useEffect, useState } from "react";
import Nav from "./nav";
import { cartContext } from "../utils/cart";

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
            setCart(JSON.parse(localCart));
        }
    }, []);

    return (
        <>
            <cartContext.Provider value={[cart, setCart]}>
                <Nav />
                <main>{children}</main>
            </cartContext.Provider>
        </>
    );
};

// Export the component
export default Layout;
