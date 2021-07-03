import { FC, useEffect, useState } from "react";
import Nav from "./nav";
import { cartContext } from "../utils/cart";
import axios from "axios";
import { CatalogueItem } from "../utils/stripe";

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
            // Parse the items from their string form
            const tempCart = JSON.parse(localCart) as CartItem[];

            // Get the full catalogue of items
            axios
                .get<CatalogueItem[]>("/api/catalogue")
                .then((res) => {
                    // Get a list of valid prices from the catalogue
                    const prices = res.data.map((item) => item.price.id);

                    // Filter out the cart items not in the catalogue and set that as the state
                    const filtered = tempCart.filter((item) =>
                        prices.includes(item.priceID)
                    );

                    // Update the local storage and the cart
                    localStorage.setItem("cart", JSON.stringify(filtered));
                    setCart(filtered);
                })
                .catch(() => setCart(tempCart));
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
