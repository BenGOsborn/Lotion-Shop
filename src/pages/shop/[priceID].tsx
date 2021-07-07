import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Stripe from "stripe";
import { stripe, getCatalogue } from "../../utils/stripe";
import {
    addToCart,
    cartContext,
    itemInCart,
    removeFromCart,
} from "../../utils/cart";
import { useContext } from "react";
import Link from "next/link";

interface Props {
    product: Stripe.Product;
    price: Stripe.Price;
}

const ProductPage: NextPage<Props> = ({ product, price }) => {
    // Initialize the context
    const [cart, setCart] = useContext(cartContext);

    return (
        <>
            <div>
                <img
                    src={product.images[0] as any} // Can there even be multiple images for this ? (have some viewable image section)
                    alt={product.name}
                    width={200}
                    height={200}
                />
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <h4>{`$${
                    (price.unit_amount as number) / 100
                } ${price.currency.toUpperCase()}`}</h4>
            </div>
            <div>
                {itemInCart(price.id, cart) === -1 ? (
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            addToCart(price.id, cart, setCart);
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
                                removeFromCart(price.id, cart, setCart);
                            }}
                        >
                            -
                        </a>
                        <span>{cart[itemInCart(price.id, cart)].quantity}</span>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                addToCart(price.id, cart, setCart);
                            }}
                        >
                            +
                        </a>
                        <div>
                            <Link href="/checkout">Checkout</Link>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export const getStaticPaths: GetStaticPaths = async () => {
    // Get the catalogue of items
    const catalogue = await getCatalogue();

    // Get the list of paths for the price ID's
    const paths = catalogue.map((item) => {
        return {
            params: {
                priceID: item.price.id,
            },
        };
    });

    // Return the path options
    return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    // Get the price ID
    const priceID = params?.priceID as string;

    // Get the details for the product and price
    const price = await stripe.prices.retrieve(priceID);
    const product = await stripe.products.retrieve(price.product as string);

    // Return the props
    return { props: { price, product } as Props };
};

// Export the component
export default ProductPage;
