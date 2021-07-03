import Link from "next/link";
import { useContext, useEffect } from "react";
import {
    cartContext,
    removeFromCart,
    addToCart,
    itemInCart,
} from "../utils/cart";

// Specify the props here

interface Props {
    name: string;
    description: string;
    images: string[];
    price: number;
    currency: string;
    productID: string;
    priceID: string;
}

// This will require the context for adding the products and checking if the product is already in ?
// I also want to have the description pop up over the image when hovered
// Convert the img tag into image

const DisplayCard = (props: Props) => {
    // Initialize the context of the cart
    const [cart, setCart] = useContext(cartContext);

    return (
        <div>
            <Link href={`/products/${props.productID}`}>
                <a>
                    <img
                        src={props.images[0] as any}
                        alt={props.name}
                        width={200}
                        height={200}
                    />
                    <h3>{props.name}</h3>
                    <h4>{`$${
                        props.price / 100
                    } ${props.currency.toUpperCase()}`}</h4>
                </a>
            </Link>
            <Link href={`/products/${props.productID}`}>View More</Link>
            {itemInCart(props.priceID, cart) === -1 ? (
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        console.log("Added " + props.priceID);
                        addToCart(props.priceID, cart, setCart);
                    }}
                >
                    Add To Cart
                    {/* Also add a button here to increment the number of items */}
                </a>
            ) : (
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        console.log("Removed " + props.priceID);
                        removeFromCart(props.priceID, cart, setCart);
                    }}
                >
                    Remove From Cart
                </a>
            )}
        </div>
    );
};

// Export the card
export default DisplayCard;