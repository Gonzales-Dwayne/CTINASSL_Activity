import { useMemo, useState } from 'react';
import blockImage from '../assets/images/carousel/block.webp';
import flow84Image from '../assets/images/carousel/flow-84.webp';
import flowLite84Image from '../assets/images/carousel/flow-lite-84.webp';
import tofu68Image from '../assets/images/carousel/tofu-68.webp';
import styles from './AllProducts.module.css';

const PRODUCTS = [
  { name: 'Lofree Flow 84', category: 'Keyboards', price: 159, image: flow84Image },
  { name: 'Lofree Flow Lite 84', category: 'Keyboards', price: 119, image: flowLite84Image },
  { name: 'Lofree Tofu 68', category: 'Keyboards', price: 129, image: tofu68Image },
  { name: 'Lofree Block 101', category: 'Keyboards', price: 169, image: blockImage },
];

const CATEGORIES = ['All Products', 'Keyboards'];

const AllProducts = () => {
  const [category, setCategory] = useState('All Products');
  const [sort, setSort] = useState('Featured');

  const visibleProducts = useMemo(() => {
    const filtered = category === 'All Products'
      ? [...PRODUCTS]
      : PRODUCTS.filter((product) => product.category === category);

    if (sort === 'Price: low to high') return filtered.sort((a, b) => a.price - b.price);
    if (sort === 'Price: high to low') return filtered.sort((a, b) => b.price - a.price);
    return filtered;
  }, [category, sort]);

  return (
    <main className={styles.page}>
      <section className={styles.intro} aria-labelledby="all-products-title">
        <p className={styles.eyebrow}>The ClackLabs catalogue</p>
        <h1 id="all-products-title">All Products</h1>
        <p className={styles.description}>
          Thoughtfully designed low-profile keyboards for a better daily setup.
        </p>
      </section>

      <section className={styles.catalogue} aria-label="Product catalogue">
        <div className={styles.toolbar}>
          <div className={styles.filters} role="group" aria-label="Filter products">
            {CATEGORIES.map((item) => (
              <button
                className={item === category ? styles.filterActive : styles.filter}
                key={item}
                type="button"
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className={styles.sortLabel}>
            <span>Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option>Featured</option>
              <option>Price: low to high</option>
              <option>Price: high to low</option>
            </select>
          </label>
        </div>

        <p className={styles.resultCount}>{visibleProducts.length} products</p>

        <div className={styles.grid}>
          {visibleProducts.map((product) => (
            <article className={styles.card} key={product.name}>
              <div className={styles.imageWrap}>
                <img src={product.image} alt={product.name} />
              </div>
              <div className={styles.cardInfo}>
                <div>
                  <p className={styles.category}>{product.category}</p>
                  <h2>{product.name}</h2>
                </div>
                <p className={styles.price}>${product.price}</p>
              </div>
              <button className={styles.shopButton} type="button">View product</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default AllProducts;
