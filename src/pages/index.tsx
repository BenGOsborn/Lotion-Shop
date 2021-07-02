import { GetStaticProps, NextPage } from "next";
import { CatalogueItem, getCatalogue } from "../utils/stripe";
import ItemCard from "../components/itemCard";

interface Props {
    catalogue: CatalogueItem[];
}

const catalogueRows = (catalogue: CatalogueItem[]) => {
    const ROW_LENGTH = 5;

    for (let i = 0; i < catalogue.length; i += ROW_LENGTH) {
        const slice = catalogue.slice(i, i + ROW_LENGTH);
        return (
            <div>
                {slice.map((item) => {
                    return (
                        <ItemCard
                            name={item.product.name}
                            description={item.product.description as string}
                            images={item.product.images}
                            price={item.price.unit_amount as number}
                            currency={item.price.currency}
                            productID={item.product.id}
                            priceID={item.price.id}
                        />
                    );
                })}
            </div>
        );
    }
};

const Shopfront: NextPage<Props> = ({ catalogue }) => {
    return (
        <>
            <header>
                <h1>Hello world!</h1>
                <p>
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Obcaecati cum officiis maxime quam consectetur autem.
                </p>
                <a href="#shop">Shop Now</a>
            </header>
            <div id="shop">{catalogueRows(catalogue)}</div>
        </>
    );
};

export const getStaticProps: GetStaticProps = async () => {
    // Get the catalogue
    const catalogue = await getCatalogue();

    // Render the page with the catalogue
    return { props: { catalogue } as Props };
};

// Export the component
export default Shopfront;
