const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Missing or invalid Authorization header" });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { tenant: true },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found for token" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
    };
    req.tenant = user.tenant;

    next();
  } catch (err) {
    console.error("JWT verification error", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = {
  authMiddleware,
  JWT_SECRET,
};
