const {
  SHIPPING_METHODS,
  loadCheckoutDraft,
  validateCheckoutContact,
  nextOrderNumber,
  productObjectId,
} = require('../models/orderModel');
const { saveAccountCart } = require('../models/cartModel');
const { products, orders, notifications } = require('../models/collections');

async function summary(req, res, next) {
  try {
    const shippingMethod = SHIPPING_METHODS[req.body?.shippingMethod]
      ? req.body.shippingMethod
      : 'standard';
    const draft = await loadCheckoutDraft(
      req.user._id,
      shippingMethod,
      req.body?.items,
    );
    return res.json(draft);
  } catch (error) {
    if (error.message === 'Your cart is empty.') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
}

async function create(req, res, next) {
  const purchased = [];
  try {
    const shippingMethod = SHIPPING_METHODS[req.body?.shippingMethod]
      ? req.body.shippingMethod
      : 'standard';
    const paymentMethod = String(req.body?.paymentMethod || 'cod');
    if (!['cod', 'demo-card'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Choose a valid payment method.' });
    }
    const contact = validateCheckoutContact(req.body);
    const draft = await loadCheckoutDraft(
      req.user._id,
      shippingMethod,
      req.body?.items,
    );

    if (draft.warnings.length > 0) {
      return res.status(409).json({
        error: draft.warnings[0].message,
        warnings: draft.warnings,
      });
    }

    const orderNumber = await nextOrderNumber();
    const items = [];

    for (const line of draft.items) {
      const result = await products().updateOne(
        {
          _id: line.productId,
          archived: { $ne: true },
          stock: { $gte: line.qty },
        },
        { $inc: { stock: -line.qty } },
      );
      if (result.modifiedCount !== 1) {
        for (const item of purchased) {
          await products().updateOne(
            { _id: item.productId },
            { $inc: { stock: item.qty } },
          );
        }
        return res.status(409).json({
          error: `${line.name} no longer has enough stock.`,
        });
      }
      purchased.push({ productId: line.productId, qty: line.qty });
      items.push({
        productId: productObjectId(line.productId),
        name: line.name,
        unitPriceCents: line.priceCents,
        qty: line.qty,
      });
    }

    const order = {
      orderNumber,
      userId: req.user._id,
      items,
      totalCents: draft.totals.totalCents,
      subtotalCents: draft.totals.subtotalCents,
      shippingCents: draft.totals.shippingCents,
      taxCents: draft.totals.taxCents,
      status: paymentMethod === 'demo-card' ? 'paid' : 'pending',
      paymentMethod,
      contactEmail: contact.contactEmail,
      shippingAddress: contact.shippingAddress,
      shippingMethod: draft.totals.shippingLabel,
      placedAt: new Date(),
    };

    let result;
    try {
      result = await orders().insertOne(order);
    } catch (insertError) {
      for (const item of purchased) {
        await products().updateOne(
          { _id: item.productId },
          { $inc: { stock: item.qty } },
        );
      }
      throw insertError;
    }

    await saveAccountCart(req.user._id, []);
    await notifications().insertOne({
      type: 'order_confirmation',
      to: contact.contactEmail,
      orderId: result.insertedId,
      status: 'pending',
      createdAt: new Date(),
    });

    const saved = await orders().findOne({ _id: result.insertedId });
    return res.status(201).json({
      order: saved,
      orderId: result.insertedId.toString(),
    });
  } catch (error) {
    if (error.message.includes('contact email') || error.message.includes('shipping address')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Your cart is empty.') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
}

module.exports = { summary, create };
