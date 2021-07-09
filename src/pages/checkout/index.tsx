import axios, { AxiosError } from "axios";
import { NextPage } from "next";
import { MouseEvent, useContext, useEffect, useState } from "react";
import { addToCart, cartContext, removeFromCart } from "../../utils/cart";
import { CatalogueItem } from "../../utils/stripe";
import { useRouter } from "next/dist/client/router";
import Link from "next/link";
import styles from "../../styles/Checkout.module.scss";
import Head from "next/head";
import { siteURL } from "../../utils/constants";

interface Props {}

interface CheckoutItems {
    name: string;
    quantity: number;
    price: number;
    priceID: string;
    currency: string;
}

export interface Status {
    success: boolean;
    log: any;
}

// I should include some sort of upsells before the user redirects to the checkout process - maybe I can have it display special offers that arent normally shown ? OR offer a discount on a bulk buy ?

const Checkout: NextPage<Props> = () => {
    // Initialize the context
    const [cart, setCart] = useContext(cartContext);

    // Initialize the states
    const [checkoutItems, setCheckoutItems] = useState<CheckoutItems[]>([]);
    const [status, setStatus] = useState<Status | null>(null);

    const router = useRouter();

    // Update the checkout items
    useEffect(() => {
        axios
            .get<CatalogueItem[]>("/api/catalogue")
            .then((res) => {
                // Make a new list of checkout items from the cart
                const newCheckoutItems: CheckoutItems[] = [];

                const priceIDs = cart.map((item) => item.priceID);
                const tuples = cart.map((item) => [
                    item.priceID,
                    item.quantity,
                ]);

                res.data.forEach((item) => {
                    if (priceIDs.includes(item.price.id)) {
                        const index = priceIDs.indexOf(item.price.id);
                        newCheckoutItems.push({
                            name: item.product.name,
                            quantity: tuples[index][1] as number,
                            price: item.price.unit_amount as number,
                            priceID: item.price.id,
                            currency: item.price.currency,
                        });
                    }
                });

                setCheckoutItems(newCheckoutItems);
            })
            .catch((error: AxiosError<string>) => {
                // Log an error message
                setStatus({ success: false, log: error.response?.data });
            });
    }, [cart]);

    const onCheckout = (e: MouseEvent<HTMLAnchorElement>) => {
        // Prevent the page from executing navigation
        e.preventDefault();

        // Get the checkout link
        axios
            .post<string>("/api/checkout", { items: cart })
            .then((res) => {
                // The cookies should be set from the response - redirect to the checkout URL
                router.push(res.data);
            })
            .catch((error: AxiosError<string>) => {
                // Log the error message
                setStatus({ success: false, log: error.response?.data });
            });
    };

    return (
        <>
            <Head>
                <title>Checkout - Lotion Shop</title>
                <meta name="description" content="Purchase your items here." />
                <link rel="canonical" href={`${siteURL}/checkout`} />
            </Head>
            <div className={styles.checkout}>
                {checkoutItems.length > 0 ? (
                    <>
                        <div className={styles.tableWrapper}>
                            <table>
                                <thead>
                                    <tr>
                                        <td>Name</td>
                                        <td>Quantity</td>
                                        <td>Price Per Item</td>
                                        <td>Price</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {checkoutItems.map((item, index) => {
                                        return (
                                            <tr key={index}>
                                                <td>
                                                    <Link
                                                        href={`/shop/${item.priceID}`}
                                                    >
                                                        {item.name}
                                                    </Link>
                                                </td>
                                                <td className={styles.counter}>
                                                    <a
                                                        href="#"
                                                        className={styles.pad}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            removeFromCart(
                                                                item.priceID,
                                                                cart,
                                                                setCart
                                                            );
                                                        }}
                                                    >
                                                        -
                                                    </a>
                                                    <span
                                                        className={styles.pad}
                                                    >
                                                        {item.quantity}
                                                    </span>
                                                    <a
                                                        href="#"
                                                        className={styles.pad}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            addToCart(
                                                                item.priceID,
                                                                cart,
                                                                setCart
                                                            );
                                                        }}
                                                    >
                                                        +
                                                    </a>
                                                </td>
                                                <td>
                                                    {`$${(
                                                        item.price / 100
                                                    ).toFixed(
                                                        2
                                                    )} ${item.currency.toUpperCase()}`}
                                                </td>
                                                <td>
                                                    {`$${(
                                                        (item.price *
                                                            item.quantity) /
                                                        100
                                                    ).toFixed(
                                                        2
                                                    )} ${item.currency.toUpperCase()}`}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className={styles.content}>
                            <a
                                href="#"
                                onClick={onCheckout}
                                className={styles.buttonCheckout}
                            >
                                Checkout
                            </a>
                            <Link href="/">Continue Shopping</Link>
                        </div>
                    </>
                ) : (
                    <p className={styles.message}>
                        Cart is empty! <Link href="/">Shop now</Link>
                    </p>
                )}
                {status ? (
                    status.success ? (
                        <p className="textSuccess">{status.log}</p>
                    ) : (
                        <p className="textFail">{status.log}</p>
                    )
                ) : null}
            </div>
        </>
    );
};

export default Checkout;
