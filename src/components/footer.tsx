import { FC } from "react";
import Link from "next/link";

const Footer: FC<{}> = () => {
    return (
        <ul>
            <li>
                <Link href="#">{`© Copyright Lotion Shop ${new Date().getFullYear()}`}</Link>
            </li>
            <li>
                <Link href="/affiliate/portal">Affiliate Portal</Link>
            </li>
            <li>
                <a href="" target="_blank">
                    Contact Us
                </a>
            </li>
            {/* Refund policy, cookie policy, privacy policy, terms and agreements etc (could probs use the ones shopify spins up) */}
        </ul>
    );
};

export default Footer;
