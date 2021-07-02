import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import {
    getProductDetails,
    getProducts,
    ProductDetails,
} from "../../utils/stripe";

interface Props {
    productDetails: ProductDetails;
}

const ProductPage: NextPage<Props> = ({ productDetails }) => {
    // Display a page for this item with image scrolls and such

    return <div>Hello world</div>;
};

export const getStaticPaths: GetStaticPaths = async () => {
    // Get a list of products
    const productDetails = await getProducts();

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
    // Get the details for the product
    const productDetails = await getProductDetails(params?.productID as string);

    // Return the props
    return { props: { productDetails } as Props };
};

export default ProductPage;
