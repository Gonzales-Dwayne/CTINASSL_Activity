import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useProfile } from './ProfileContext';
import { useProducts } from './ProductsContext';
import { CartContext } from './CartContext';

const STORAGE_KEY = 'clacklabs-cart';

function readCart() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(stored)) return [];
    return stored
      .filter(
        (item) =>
          item && typeof item.id === 'string' && Number.isInteger(item.qty) && item.qty > 0,
      )
      .map((item) => ({ id: item.id, qty: Math.min(99, item.qty) }));
  } catch {
    return [];
  }
}

function serverCartItems(payload) {
  return (Array.isArray(payload?.items) ? payload.items : []).map((item) => ({
    id: String(item.productId || item.id),
    qty: item.qty,
  }));
}

async function readJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to update the cart.');
  }
  return payload;
}

export function CartProvider({ children }) {
  const { token } = useProfile();
  const { products } = useProducts();
  const [items, setItems] = useState(readCart);
  const [cartError, setCartError] = useState('');
  const itemsRef = useRef(items);
  const previousToken = useRef(token);

  useEffect(() => {
    itemsRef.current = items;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!token) {
      previousToken.current = null;
      return undefined;
    }

    let active = true;
    const mergeGuestCart = !previousToken.current;
    previousToken.current = token;

    const request = mergeGuestCart
      ? fetch(`${API_BASE_URL}/api/account/cart/merge`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items: readCart() }),
        })
      : fetch(`${API_BASE_URL}/api/account/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });

    request
      .then((response) => readJson(response))
      .then((payload) => {
        if (!active) return;
        setItems(serverCartItems(payload));
        setCartError(payload.warnings?.[0]?.message || '');
      })
      .catch((error) => {
        if (active) setCartError(error.message);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const value = useMemo(() => {
    const syncCart = (nextItems) => {
      if (!token) return;

      fetch(`${API_BASE_URL}/api/account/cart`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: nextItems }),
      })
        .then((response) => readJson(response))
        .then((payload) => {
          setItems(serverCartItems(payload));
          setCartError(payload.warnings?.[0]?.message || '');
        })
        .catch((error) => {
          setCartError(error.message);
        });
    };

    const stockFor = (id) => {
      const product = products.find((item) => item.id === id);
      if (!product) return 0;
      return Number.isInteger(product.stock) ? product.stock : 99;
    };

    const addItem = (id, qty = 1) => {
      const stock = stockFor(id);
      const existing = itemsRef.current.find((item) => item.id === id);
      const currentQty = existing?.qty || 0;

      if (stock < 1) {
        return { ok: false, message: 'This product is out of stock.' };
      }
      if (currentQty + qty > stock) {
        return {
          ok: false,
          message: `Only ${stock} of this product ${stock === 1 ? 'is' : 'are'} available.`,
        };
      }

      const next = existing
        ? itemsRef.current.map((item) =>
            item.id === id ? { ...item, qty: Math.min(stock, item.qty + qty) } : item,
          )
        : [...itemsRef.current, { id, qty: Math.max(1, qty) }];

      itemsRef.current = next;
      setItems(next);
      setCartError('');
      syncCart(next);
      return { ok: true };
    };

    const removeItem = (id) => {
      const next = itemsRef.current.filter((item) => item.id !== id);
      itemsRef.current = next;
      setItems(next);
      setCartError('');
      syncCart(next);
    };

    const setQuantity = (id, qty) => {
      if (qty <= 0) {
        removeItem(id);
        return { ok: true };
      }

      const stock = stockFor(id);
      if (qty > stock) {
        return {
          ok: false,
          message: `Only ${stock} of this product ${stock === 1 ? 'is' : 'are'} available.`,
        };
      }

      const next = itemsRef.current.map((item) =>
        item.id === id ? { ...item, qty } : item,
      );
      itemsRef.current = next;
      setItems(next);
      setCartError('');
      syncCart(next);
      return { ok: true };
    };

    const clearCart = () => {
      itemsRef.current = [];
      setItems([]);
      setCartError('');
      syncCart([]);
    };

    const count = items.reduce((total, item) => total + item.qty, 0);

    return {
      items,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      count,
      cartError,
      clearCartError: () => setCartError(''),
    };
  }, [items, token, products, cartError]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
