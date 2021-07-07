import { GetStaticProps, NextPage } from "next";
import { CatalogueItem, getCatalogue } from "../utils/stripe";
import DisplayCard from "../components/displayCard";
import { ITEMS_PER_ROW } from "../utils/constants";

interface Props {
    catalogue: CatalogueItem[];
}

const Shopfront: NextPage<Props> = ({ catalogue }) => {
    return (
        <>
            <header>
                <h1>Lotion Shop</h1>
                <p>
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Obcaecati cum officiis maxime quam consectetur autem.
                </p>
                <a href="#shop">Shop Now</a>
            </header>
            <div id="shop">
                {catalogue.map((_, i) => {
                    // List out the rows
                    if (i % ITEMS_PER_ROW === 0) {
                        return (
                            <div key={i}>
                                {catalogue
                                    .slice(i, i + ITEMS_PER_ROW)
                                    .map((item, i) => {
                                        return (
                                            <DisplayCard
                                                key={i}
                                                name={item.product.name}
                                                description={
                                                    item.product
                                                        .description as string
                                                }
                                                images={item.product.images}
                                                price={
                                                    item.price
                                                        .unit_amount as number
                                                }
                                                currency={item.price.currency}
                                                priceID={item.price.id}
                                            />
                                        );
                                    })}
                            </div>
                        );
                    }
                })}
            </div>
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
