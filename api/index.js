const app = require("../src/app");

// Vercel expects a function export that takes (req, res)
module.exports = (req, res) => {
  return app(req, res);
};
