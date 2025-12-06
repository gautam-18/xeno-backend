const express = require("express");
const prisma = require("../prisma");
const { authMiddleware } = require("../middleware/auth");
const {
  fetchCustomers,
  fetchProducts,
  fetchOrders,
} = require("../lib/shopify");

const router = express.Router();

/**
 * POST /ingest/shopify
 * Auth: Bearer token
 *
 * Optional query/body:
 * {
 *   "limit": 100
 * }
 */
router.post("/shopify", authMiddleware, async (req, res) => {
  const tenant = req.tenant;
  const limit = Number(req.body.limit || req.query.limit || 100);

  try {
    // Fetch from Shopify
    const [customers, products, orders] = await Promise.all([
      fetchCustomers(tenant, { limit }),
      fetchProducts(tenant, { limit }),
      fetchOrders(tenant, { limit }),
    ]);

    // Upsert customers
    for (const c of customers) {
      await prisma.customer.upsert({
        where: {
          tenantId_shopifyId: {
            tenantId: tenant.id,
            shopifyId: String(c.id),
          },
        },
        update: {
          email: c.email || null,
          firstName: c.first_name || null,
          lastName: c.last_name || null,
          phone: c.phone || null,
          totalSpent: c.total_spent ? c.total_spent : null,
          rawJson: c,
        },
        create: {
          tenantId: tenant.id,
          shopifyId: String(c.id),
          email: c.email || null,
          firstName: c.first_name || null,
          lastName: c.last_name || null,
          phone: c.phone || null,
          totalSpent: c.total_spent ? c.total_spent : null,
          rawJson: c,
        },
      });
    }

    // Upsert products
    for (const p of products) {
      const firstVariant = (p.variants && p.variants[0]) || null;

      await prisma.product.upsert({
        where: {
          tenantId_shopifyId: {
            tenantId: tenant.id,
            shopifyId: String(p.id),
          },
        },
        update: {
          title: p.title,
          sku: firstVariant ? firstVariant.sku || null : null,
          price: firstVariant ? firstVariant.price || null : null,
          rawJson: p,
        },
        create: {
          tenantId: tenant.id,
          shopifyId: String(p.id),
          title: p.title,
          sku: firstVariant ? firstVariant.sku || null : null,
          price: firstVariant ? firstVariant.price || null : null,
          rawJson: p,
        },
      });
    }

    // Upsert orders
    for (const o of orders) {
      await prisma.order.upsert({
        where: {
          tenantId_shopifyId: {
            tenantId: tenant.id,
            shopifyId: String(o.id),
          },
        },
        update: {
          orderNumber: o.order_number || null,
          totalPrice: o.total_price || null,
          currency: o.currency || null,
          processedAt: o.processed_at ? new Date(o.processed_at) : null,
          customerShopifyId: o.customer ? String(o.customer.id) : null,
          rawJson: o,
        },
        create: {
          tenantId: tenant.id,
          shopifyId: String(o.id),
          orderNumber: o.order_number || null,
          totalPrice: o.total_price || null,
          currency: o.currency || null,
          processedAt: o.processed_at ? new Date(o.processed_at) : null,
          customerShopifyId: o.customer ? String(o.customer.id) : null,
          rawJson: o,
        },
      });
    }

    return res.json({
      message: "Ingestion completed",
      stats: {
        customersFetched: customers.length,
        productsFetched: products.length,
        ordersFetched: orders.length,
      },
    });
  } catch (err) {
    console.error(
      "Error in /ingest/shopify",
      err.response?.data || err.message || err
    );
    return res.status(500).json({
      message: "Failed to ingest data from Shopify",
      error: err.message,
    });
  }
});

module.exports = router;
