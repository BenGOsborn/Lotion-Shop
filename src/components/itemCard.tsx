import Link from "next/link";
import vercel from "../public/vercel.svg";

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
// COnvert the img tag into image

const ItemCard = (props: Props) => {
    return (
        <div>
            <Link href={`/item/${props.productID}`}>
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
            <Link href={`/item/${props.productID}`}>View More</Link>
            <a href="#" onClick={(e) => console.log(props.priceID)}>
                Add To Cart
            </a>
        </div>
    );
};

export default ItemCard;
