import { FC, useEffect, useState } from "react";
import Nav from "./nav";
import { cartContext } from "../utils/cart";
import Display from "./display";
import Footer from "./footer";
import TagManager from "react-gtm-module";
import Head from "next/head";

export interface CartItem {
    priceID: string;
    quantity: number;
}

const Layout: FC<{}> = ({ children }) => {
    // The state of the cart to be used across components
    const [cart, setCart] = useState<CartItem[]>([]);

    // Set the context to whatever is inside the local storage, initialize Google Tag Manager
    useEffect(() => {
        // Initialize GTM
        TagManager.initialize({ gtmId: process.env.GTM_ID as string });

        // Initialize the cart
        const localCart = localStorage.getItem("cart");
        if (localCart) {
            // Parse the items from their string form and store them in the state
            setCart(JSON.parse(localCart));
        }
    }, []);

    return (
        <>
            <Head>
                <meta charSet="UTF-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <meta
                    name="keywords"
                    content="lotion, shop, ecommerce, cream, store"
                />
                <meta name="robots" content="index, follow" />
                <link rel="manifest" href="/manifest.json" />
                <title>Lotion Shop</title>
                <meta
                    name="description"
                    content="An ecommerce shop designed to sell lotions."
                />
            </Head>
            <cartContext.Provider value={[cart, setCart]}>
                <Nav />
                <main>{children}</main>
                <Display />
                <Footer />
            </cartContext.Provider>
        </>
    );
};

// Export the component
export default Layout;
