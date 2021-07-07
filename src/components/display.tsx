import { FC, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { ITEMS_PER_ROW } from "../utils/constants";
import { CatalogueItem } from "../utils/stripe";
import DisplayCard from "./displayCard";

const Display: FC<{}> = () => {
    // Store the content
    const [catalogue, setCatalogue] = useState<CatalogueItem[]>([]);

    // Fetch the catalogue data and select elements randomly
    useEffect(() => {
        axios
            .get<CatalogueItem[]>("/api/catalogue")
            .then((result) => {
                // Randomly select an amount of items and set the items to be them
                const newCatalogue = [...result.data]
                    .sort(() => Math.random())
                    .slice(0, ITEMS_PER_ROW);

                // Set the items
                setCatalogue(newCatalogue);
            })
            .catch();
    }, []);

    if (catalogue.length > 0) {
        return (
            // A list of the items in a row
            <div>
                <h4>Items you may be interested in</h4>
                <div>
                    {catalogue.map((item, i) => {
                        return (
                            <DisplayCard
                                key={i}
                                name={item.product.name}
                                description={item.product.description as string}
                                images={item.product.images}
                                price={item.price.unit_amount as number}
                                currency={item.price.currency}
                                priceID={item.price.id}
                            />
                        );
                    })}
                </div>
            </div>
        );
    } else {
        return null;
    }
};

export default Display;
