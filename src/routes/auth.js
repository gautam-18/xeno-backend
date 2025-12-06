const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

/**
 * Register a tenant + first user
 * Body:
 * {
 *   "tenantName": "My Brand",
 *   "shopDomain": "my-shop.myshopify.com",
 *   "shopAccessToken": "shpat_...",
 *   "email": "owner@example.com",
 *   "password": "supersecret"
 * }
 */
router.post("/register", async (req, res) => {
  try {
    const { tenantName, shopDomain, shopAccessToken, email, password } =
      req.body;

    if (!tenantName || !shopDomain || !shopAccessToken || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        shopDomain,
        accessToken: shopAccessToken,
        users: {
          create: {
            email,
            passwordHash,
          },
        },
      },
      include: { users: true },
    });

    const user = tenant.users[0];

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: tenant.id,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      token,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        shopDomain: tenant.shopDomain,
      },
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Error in /auth/register", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Login an existing user
 * Body:
 * {
 *   "email": "owner@example.com",
 *   "password": "supersecret"
 * }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        shopDomain: user.tenant.shopDomain,
      },
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Error in /auth/login", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
