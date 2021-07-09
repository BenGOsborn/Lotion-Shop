module.exports = {
    reactStrictMode: true,
    images: {
        domains: ["files.stripe.com"],
    },
    env: {
        GTM_ID: process.env.GTM_ID,
    },
};
