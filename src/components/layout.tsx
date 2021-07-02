import { FC, useState, useMemo } from "react";
import Nav from "./nav";
import { cartContext } from "../utils/contexts";

export interface CartItem {
    costID: string;
    quantity: number;
}

const Layout: FC<{}> = ({ children }) => {
    // The state of the cart to be used across components
    const [cart, setCart] = useState<CartItem[]>([]);

    // Prevent excess changes from being made
    const value = useMemo(() => [cart, setCart], [cart, setCart]);

    return (
        <>
            <cartContext.Provider value={value as any}>
                <Nav />
                <main>{children}</main>
            </cartContext.Provider>
        </>
    );
};

// Export the component
export default Layout;
