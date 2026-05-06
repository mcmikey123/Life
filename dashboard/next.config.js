const path = require("node:path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false,
    // Tell Next's file tracer to consider the repo root, not just the dashboard dir,
    // so the vault/ folder one level up gets traced.
    outputFileTracingRoot: path.join(__dirname, ".."),
    // Belt-and-braces: explicitly include all vault markdown for every route.
    outputFileTracingIncludes: {
      "/**/*": ["../vault/**/*.md"],
    },
  },
  env: {
    VAULT_PATH: process.env.VAULT_PATH || "../vault",
  },
};

module.exports = nextConfig;
