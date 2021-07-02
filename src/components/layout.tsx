import { FC } from "react";

// This is also going to contain the shopping cart as a context which will be shared accross the rest of the components

const Layout: FC<{}> = ({ children }) => {
    return (
        <>
            <main>{children}</main>
        </>
    );
};

// Export the component
export default Layout;
