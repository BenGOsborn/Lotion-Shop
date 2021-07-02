import axios from "axios";
import { GetStaticProps, NextPage } from "next";
import { Catalogue } from "../utils/stripe";

interface Props {
    catalogue: Catalogue;
}

const Shopfront: NextPage<Props> = ({ catalogue }) => {
    axios
        .get<Catalogue>("/api/catalogue")
        .then((res) => {
            console.log(res);
        })
        .catch((err) => console.log(err));

    return (
        <div>
            <h1>Hello world!</h1>
        </div>
    );
};

// export const getStaticProps: GetStaticProps = async () => {
//     // Get the catalogue
//     const { data: catalogue } = await axios.get<Catalogue>("/api/catalogue");

//     // Render the page with the catalogue
//     return { props: { catalogue } as Props };
// };

// Export the component
export default Shopfront;
