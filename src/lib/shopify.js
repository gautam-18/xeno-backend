const axios = require("axios");
require("dotenv").config();

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2024-04";

function shopifyClient(tenant) {
  if (!tenant.shopDomain || !tenant.accessToken) {
    throw new Error("Tenant is missing Shopify credentials");
  }

  const baseURL = `https://${tenant.shopDomain}/admin/api/${SHOPIFY_API_VERSION}`;

  const instance = axios.create({
    baseURL,
    headers: {
      "X-Shopify-Access-Token": tenant.accessToken,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

  return instance;
}

/**
 * NOTE: This fetches a single page (up to limit) for simplicity.
 * You can extend this to handle cursor-based pagination using `page_info` later.
 */

async function fetchCustomers(tenant, { limit = 100 } = {}) {
  const client = shopifyClient(tenant);
  const res = await client.get("/customers.json", {
    params: { limit },
  });
  return res.data.customers || [];
}

async function fetchProducts(tenant, { limit = 100 } = {}) {
  const client = shopifyClient(tenant);
  const res = await client.get("/products.json", {
    params: { limit },
  });
  return res.data.products || [];
}

async function fetchOrders(tenant, { limit = 100, status = "any" } = {}) {
  const client = shopifyClient(tenant);
  const res = await client.get("/orders.json", {
    params: { limit, status },
  });
  return res.data.orders || [];
}

module.exports = {
  fetchCustomers,
  fetchProducts,
  fetchOrders,
};
