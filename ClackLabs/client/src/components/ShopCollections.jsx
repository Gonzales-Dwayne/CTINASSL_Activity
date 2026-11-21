import { useProducts } from '../context/ProductsContext';
import styles from './ShopCollections.module.css';

const ShopCollections = ({ onNavigate }) => {
  const { products } = useProducts();
  const findProduct = (id) => products.find((product) => product.id === id);
  const firstInCategory = (category) =>
    products.find((product) => product.category === category);

  const collections = [
    {
      id: 'mechanical-keyboards',
      label: 'Mechanical Keyboards',
      category: 'Keyboards',
      image: findProduct('lofree-flow-84-white')?.image,
    },
    {
      id: 'magnetic-keyboards',
      label: 'Magnetic Keyboards',
      category: 'Keyboards',
      image: findProduct('lofree-hyzen-silver')?.image,
    },
    {
      id: 'keycaps',
      label: 'Keycaps',
      category: 'Keycaps',
      image: firstInCategory('Keycaps')?.image,
    },
    {
      id: 'switches',
      label: 'Switches',
      category: 'Switches',
      image: firstInCategory('Switches')?.image,
    },
  ];

  return (
    <section className={styles.shopCollections} aria-labelledby="shop-collections-title">
      <div className={styles.inner}>
        <h2 className={styles.heading} id="shop-collections-title">
          Shop Collections
        </h2>

        <div className={styles.grid}>
          {collections.map((collection) => (
            <button
              className={styles.card}
              type="button"
              key={collection.id}
              onClick={() => onNavigate?.(collection.category)}
            >
              <span className={styles.cardArt}>
                <img src={collection.image} alt="" loading="lazy" />
              </span>
              <span className={styles.cardName}>{collection.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopCollections;
