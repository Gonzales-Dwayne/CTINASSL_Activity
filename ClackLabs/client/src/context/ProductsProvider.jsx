import { useEffect, useMemo, useState } from 'react';
import { PRODUCTS as LOCAL_PRODUCTS } from '../data/products';
import { API_BASE_URL, DATA_SOURCE } from '../config';
import { ProductsContext } from './ProductsContext';

function normalizeProduct(product) {
  const image = product.image || '';

  return {
    ...product,
    id: product.id || product.slug || product._id,
    price:
      typeof product.price === 'number'
        ? product.price
        : Math.round((product.priceCents || 0) / 100),
    image: image.startsWith('http') ? image : `${API_BASE_URL}${image}`,
  };
}

export function ProductsProvider({ children }) {
  const useMongo = DATA_SOURCE === 'mongodb';
  const [products, setProducts] = useState(useMongo ? [] : LOCAL_PRODUCTS);
  const [isLoading, setIsLoading] = useState(useMongo);
  const [source, setSource] = useState(useMongo ? 'mongodb' : 'local');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!useMongo) return undefined;

    let active = true;

    async function loadProducts() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) {
          throw new Error(`Product API returned ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Product API returned no products');
        }

        if (!active) return;
        setProducts(data.map(normalizeProduct));
        setSource('mongodb');
        setError(null);
      } catch (requestError) {
        if (!active) return;
        console.warn(
          'MongoDB product API unavailable; falling back to local catalogue.',
          requestError,
        );
        setProducts(LOCAL_PRODUCTS);
        setSource('local');
        setError(requestError.message);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [useMongo]);

  const value = useMemo(
    () => ({ products, isLoading, source, error }),
    [products, isLoading, source, error],
  );

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  );
}
