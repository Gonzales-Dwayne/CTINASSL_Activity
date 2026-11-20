import styles from './ShopCollections.module.css';

const COLLECTIONS = [
  { id: 'mechanical-keyboards', label: 'Mechanical Keyboards' },
  { id: 'magnetic-keyboards', label: 'Magnetic Keyboards' },
  { id: 'keycaps', label: 'Keycaps' },
  { id: 'switches', label: 'Switches' },
];

function KeyboardArt({ magnetic = false }) {
  return (
    <svg viewBox="0 0 200 140" aria-hidden="true">
      <ellipse cx="100" cy="112" rx="66" ry="8" fill="#000" opacity=".07" />
      <g transform="rotate(-7 100 70)">
        <rect
          x="24"
          y="45"
          width="152"
          height="54"
          rx="8"
          fill={magnetic ? '#282c31' : '#bdb5a5'}
        />
        <rect
          x="30"
          y="50"
          width="140"
          height="41"
          rx="5"
          fill={magnetic ? '#3a4046' : '#ebe7df'}
        />
        {Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 10 }, (_, column) => {
            const accent =
              magnetic && (row === 0 || row === 2) && (column === 2 || column === 7);
            return (
              <rect
                key={`${row}-${column}`}
                x={35 + column * 13.2}
                y={56 + row * 11}
                width="10.5"
                height="8"
                rx="2"
                fill={
                  accent
                    ? column === 2
                      ? '#e8874c'
                      : '#5b90d8'
                    : magnetic
                      ? '#555c64'
                      : '#d2ccc1'
                }
              />
            );
          }),
        )}
      </g>
    </svg>
  );
}

function CollectionArt({ type }) {
  if (type === 'mechanical-keyboards') {
    return <KeyboardArt />;
  }

  if (type === 'magnetic-keyboards') {
    return <KeyboardArt magnetic />;
  }

  if (type === 'keycaps') {
    return (
      <svg viewBox="0 0 200 140" aria-hidden="true">
        <ellipse cx="100" cy="112" rx="62" ry="8" fill="#000" opacity=".07" />
        <g transform="rotate(-7 100 70)">
          <rect x="34" y="56" width="68" height="44" rx="8" fill="#3158a6" />
          <rect x="100" y="56" width="66" height="44" rx="8" fill="#3158a6" />
          <rect x="38" y="47" width="34" height="26" rx="5" fill="#d6d4cf" />
          <rect x="79" y="47" width="28" height="26" rx="5" fill="#c53a37" />
          <rect x="110" y="47" width="29" height="26" rx="5" fill="#e3b63d" />
          <rect x="144" y="47" width="34" height="26" rx="5" fill="#d6d4cf" />
          <rect x="43" y="77" width="29" height="26" rx="5" fill="#cf3a36" />
          <rect x="78" y="77" width="29" height="26" rx="5" fill="#e1b33b" />
          <rect x="113" y="77" width="29" height="26" rx="5" fill="#d6d4cf" />
          <rect x="148" y="77" width="27" height="26" rx="5" fill="#c53a37" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 200 140" aria-hidden="true">
      <ellipse cx="100" cy="111" rx="61" ry="8" fill="#000" opacity=".07" />
      <g transform="rotate(-9 100 70)">
        <rect x="42" y="50" width="50" height="50" rx="7" fill="#343839" />
        <rect x="51" y="59" width="32" height="32" rx="5" fill="#4c5352" />
        <circle cx="67" cy="75" r="7" fill="#1b1d1d" />
        <rect x="100" y="61" width="50" height="50" rx="7" fill="#343839" />
        <rect x="109" y="70" width="32" height="32" rx="5" fill="#4c5352" />
        <circle cx="125" cy="86" r="7" fill="#1b1d1d" />
      </g>
    </svg>
  );
}

const ShopCollections = () => {
  return (
    <section className={styles.shopCollections} aria-labelledby="shop-collections-title">
      <div className={styles.inner}>
        <h2 className={styles.heading} id="shop-collections-title">
          Shop Collections
        </h2>

        <div className={styles.grid}>
          {COLLECTIONS.map((collection) => (
            <a className={styles.card} href={`#${collection.id}`} key={collection.id}>
              <div className={styles.cardArt}>
                <CollectionArt type={collection.id} />
              </div>
              <span className={styles.cardName}>{collection.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopCollections;
