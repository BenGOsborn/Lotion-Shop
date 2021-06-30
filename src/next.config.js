module.exports = {
    reactStrictMode: true,
    siteURL:
        process.env.NODE_ENV !== "production"
            ? "http://localhost:3000"
            : "https://siteurl.com",
};
