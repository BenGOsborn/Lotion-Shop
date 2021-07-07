import Link from "next/link";
import { FC, useContext } from "react";
import {
    cartContext,
    removeFromCart,
    addToCart,
    itemInCart,
} from "../utils/cart";
import styles from "../styles/DisplayCard.module.scss";

// Specify the props here

interface Props {
    name: string;
    description: string;
    images: string[];
    price: number;
    currency: string;
    priceID: string;
}

// I also want to have the description pop up over the image when hovered
// Convert the img tag into image

const DisplayCard: FC<Props> = (props) => {
    // Initialize the context of the cart
    const [cart, setCart] = useContext(cartContext);

    return (
        <div className={styles.card}>
            <div>
                <Link href={`/shop/${props.priceID}`}>
                    <a>
                        <img
                            src={props.images[0] as any}
                            alt={props.name}
                            width={150}
                            height={150}
                        />
                        <h3>{props.name}</h3>
                        <h4>{`$${
                            props.price / 100
                        } ${props.currency.toUpperCase()}`}</h4>
                    </a>
                </Link>
            </div>
            <div>
                <Link href={`/shop/${props.priceID}`}>View More</Link>
            </div>
            <div>
                {itemInCart(props.priceID, cart) === -1 ? (
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            addToCart(props.priceID, cart, setCart);
                        }}
                    >
                        Add To Cart
                    </a>
                ) : (
                    <>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                removeFromCart(props.priceID, cart, setCart);
                            }}
                        >
                            -
                        </a>
                        <span>
                            {cart[itemInCart(props.priceID, cart)].quantity}
                        </span>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                addToCart(props.priceID, cart, setCart);
                            }}
                        >
                            +
                        </a>
                    </>
                )}
            </div>
            <div>
                <Link href="/checkout">View Cart</Link>
            </div>
        </div>
    );
};

// Export the card
export default DisplayCard;
