// Collection schemas used by the API layer. The database remains schema-flexible,
// but these definitions document the document shape each model expects.
const objectId = { bsonType: 'objectId' };
const string = { bsonType: 'string' };
const int = { bsonType: 'int' };
const bool = { bsonType: 'bool' };
const date = { bsonType: 'date' };
const dateOrString = { bsonType: ['date', 'string'] };

const userSchema = {
  bsonType: 'object',
  required: ['_id', 'name', 'email', 'passwordHash', 'role'],
  properties: {
    _id: objectId,
    name: string,
    email: string,
    passwordHash: string,
    role: { enum: ['customer', 'admin'] },
    cart: { bsonType: 'array' },
    wishlist: { bsonType: 'array' },
    addresses: { bsonType: 'array' },
    passwordChangedAt: date,
    createdAt: dateOrString,
    updatedAt: dateOrString,
  },
};

const productSchema = {
  bsonType: 'object',
  required: ['_id', 'name', 'slug', 'category', 'priceCents', 'stock', 'description', 'image'],
  properties: {
    _id: string,
    id: string,
    slug: string,
    name: string,
    category: string,
    subcategory: { bsonType: ['string', 'null'] },
    price: int,
    priceCents: int,
    currency: string,
    stock: int,
    sku: string,
    barcode: string,
    description: string,
    details: { bsonType: 'array', items: string },
    specs: { bsonType: 'object' },
    sourceUrl: { bsonType: ['string', 'null'] },
    detailsUpdatedAt: string,
    image: string,
    imageFile: string,
    featured: bool,
    archived: bool,
    lowStockThreshold: int,
    restockNote: string,
    sortOrder: int,
    createdAt: string,
    updatedAt: string,
  },
};

const cartSchema = {
  bsonType: 'object',
  required: ['_id', 'userId', 'items'],
  properties: {
    _id: objectId,
    userId: objectId,
    items: {
      bsonType: 'array',
      items: {
        bsonType: 'object',
        required: ['productId', 'qty'],
        properties: { productId: string, qty: int },
      },
    },
    createdAt: string,
    updatedAt: string,
  },
};

const orderSchema = {
  bsonType: 'object',
  required: ['_id', 'userId', 'items', 'orderNumber', 'totalCents', 'status', 'placedAt'],
  properties: {
    _id: objectId,
    userId: objectId,
    items: {
      bsonType: 'array',
      items: {
        bsonType: 'object',
        properties: {
          productId: objectId,
          name: string,
          unitPriceCents: int,
          qty: int,
        },
      },
    },
    orderNumber: string,
    totalCents: int,
    subtotalCents: int,
    shippingCents: int,
    taxCents: int,
    status: string,
    paymentMethod: string,
    contactEmail: string,
    shippingMethod: string,
    shippingAddress: { bsonType: 'object' },
    placedAt: date,
  },
};

const categorySchema = {
  bsonType: 'object',
  required: ['_id', 'name', 'productCount', 'sortOrder'],
  properties: {
    _id: string,
    name: string,
    description: string,
    image: string,
    productCount: int,
    sortOrder: int,
    updatedAt: string,
  },
};

const wishlistSchema = {
  bsonType: 'object',
  required: ['_id', 'userId', 'productIds'],
  properties: {
    _id: objectId,
    userId: objectId,
    productIds: { bsonType: 'array', items: string },
    createdAt: string,
    updatedAt: string,
  },
};

const notificationSchema = {
  bsonType: 'object',
  required: ['type', 'to', 'orderId', 'status', 'createdAt'],
  properties: {
    _id: objectId,
    type: string,
    to: string,
    orderId: objectId,
    status: string,
    error: string,
    sentAt: date,
    createdAt: date,
  },
};

module.exports = {
  userSchema,
  productSchema,
  cartSchema,
  orderSchema,
  categorySchema,
  wishlistSchema,
  notificationSchema,
};
