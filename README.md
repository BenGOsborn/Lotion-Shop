# [Lotion Shop](https://lotion-shop.herokuapp.com/)

## An eCommerce store that sells lotions.

### How it was built

The app was built using NextJS and TypeScript for both the frontend and backend. This provided me with a framework for building a frontend using ReactJS while still getting the benefits of server-side rendering, as well as a backend REST API with ease. The backend is connected to a MongoDB database hosted on Atlas which stores the information for the affiliates. The server is hosted on Heroku and is set up to automatically deploy to it whenever a commit is pushed to the main branch. The frontend is styled using Sass, which provides a much nicer experience compared to traditional CSS. The entire payment system is mostly handled using the Stripe platform, with only a small amount of modification to the affiliate system, allowing us to not worry about handling or storing payments ourselves.

Customers can add items to their cart which is stored in local storage for persistence without the need for a login system (reducing the number of steps required for the customer to make a purchase). Customers can then proceed to the checkout. When they checkout, their items and their respective quantities are sent to the checkout route, which creates a new checkout session using Stripe and then redirects the customer to it to make their purchase. Once their purchase is complete, they will be redirected to a success page where they can view their receipt for their purchase, and their email will be subscribed to our Mailchimp mailing list.

In addition to a checkout system, the site also features a full affiliate system, allowing for influencers to promote our product and earn revenue for each purchase made within a week of their referral. To connect an affiliate, a link will be sent to them where they can set a password for their account, and then they will be sent a Stripe onboarding link to connect their account to our platform. On success, they will then be redirected to their Stripe dashboard where they can view their payments from us and change their settings.

When a customer uses an affiliate link, a cookie will be stored in their browser for 7 days with the affiliates code. When they attempt to checkout, a custom checkout is made that will automatically transfer a percentage of the total funds to the affiliate sent in a cookie automatically through Stripe. This means that if a purchase needs to be refunded, it can all be handled simply using Stripe, without the need to track down multiple payments.

Cookies are also securely stored on the frontend which are used for identifying the customer on different purchases, and tracking receipts.
