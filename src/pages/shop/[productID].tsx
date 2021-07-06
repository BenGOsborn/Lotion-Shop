import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Stripe from "stripe";
import { stripe } from "../../utils/stripe";

interface Props {
    productDetails: { product: Stripe.Product; prices: Stripe.Price[] };
}

const ProductPage: NextPage<Props> = ({ productDetails }) => {
    return <div>{JSON.stringify(productDetails)}</div>;
};

export const getStaticPaths: GetStaticPaths = async () => {
    // Get a list of products
    const productDetails = (await stripe.products.list({ limit: 100 })).data;

    // Get the list of paths
    const paths = productDetails.map((product) => {
        return {
            params: {
                productID: product.id,
            },
        };
    });

    // Return the path options
    return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    // Get the product ID
    const productID = params?.productID as string;

    // Get the details for the product
    const pricesPromise = stripe.prices.list({ limit: 100 });
    const productPromise = stripe.products.retrieve(productID);

    // Get the data from the promises
    const product = await productPromise;

    // Get the prices that belong to the product
    const prices: Stripe.Price[] = [];
    for (const price of (await pricesPromise).data) {
        if (price.product === productID) {
            prices.push(price);
        }
    }

    // ****** We should filter items out that have one or the other not active

    const productDetails = { product, prices: prices };

    // Return the props
    return { props: { productDetails } as Props };
};

// Export the component
export default ProductPage;
