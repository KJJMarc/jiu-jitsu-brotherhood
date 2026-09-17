import Image from "next/image";
import Link from "next/link";
import type { HomeProduct } from "@/lib/home/prototype";
import styles from "./jjb-home.module.css";

type Props = {
  products: HomeProduct[];
};

export default function ShopPreview({ products }: Props) {
  return (
    <section
      className={`${styles.band} ${styles.bandWhite}`}
      aria-labelledby="shop-heading"
    >
      <div className={styles.wide}>
        <div className={styles.headRow}>
          <div>
            <p className={styles.kicker}>Shop</p>
            <h2 id="shop-heading">JJB Gear</h2>
            <p className={styles.shopNote}>
              A collection of rashguards, clothing and gear from Jiu Jitsu
              Brotherhood.
            </p>
          </div>
          <Link className={styles.textLink} href="/collections/all">
            Visit the shop
          </Link>
        </div>

        <div className={styles.shopGrid}>
          {products.map((product) => (
            <Link
              key={product.href}
              href={product.href}
              className={styles.shopCard}
            >
              <div className={styles.shopFrame}>
                <Image
                  src={product.image.src}
                  alt={product.image.alt}
                  width={product.image.width}
                  height={product.image.height}
                  sizes="(max-width: 700px) 70vw, 28vw"
                />
              </div>
              <h3 className={styles.shopTitle}>{product.title}</h3>
              {product.priceLabel ? (
                <p className={styles.shopPrice}>{product.priceLabel}</p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
