const { getDbInstance } = require('../db');

function collection(name) {
  return getDbInstance().collection(name);
}

const users = () => collection('users');
const products = () => collection('products');
const carts = () => collection('carts');
const orders = () => collection('orders');
const categories = () => collection('categories');
const wishlists = () => collection('wishlists');
const notifications = () => collection('notifications');

module.exports = {
  collection,
  users,
  products,
  carts,
  orders,
  categories,
  wishlists,
  notifications,
};
