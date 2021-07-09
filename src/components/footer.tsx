import { FC } from "react";
import Link from "next/link";
import styles from "../styles/Footer.module.scss";

const Footer: FC<{}> = () => {
    return (
        <footer className={styles.footer}>
            <Link href="#">{`© Copyright Lotion Shop ${new Date().getFullYear()}`}</Link>
            <Link href="/affiliate/portal">Affiliate Portal</Link>
            <a href="" target="_blank" rel="noreferrer">
                Contact Us
            </a>
            {/* Refund policy, cookie policy, privacy policy, terms and agreements etc (could probs use the ones shopify spins up) */}
        </footer>
    );
};

export default Footer;
