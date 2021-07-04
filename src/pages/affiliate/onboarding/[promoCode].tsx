import { GetServerSideProps, NextPage } from "next";

interface Props {}

const Onboarding: NextPage<Props> = () => {
    return null;
};

export const getServerSideProps: GetServerSideProps = async ({
    req,
    res,
    params,
}) => {
    // Get the promo code from the request
    const promoCode: string = (params as any).promoCode;

    // Look up that user and set a cookie, then return

    return { props: {} as Props };
};

// Export the component
export default Onboarding;
