/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: false },
  // The vault lives one directory up. The dashboard reads it at runtime.
  env: {
    VAULT_PATH: process.env.VAULT_PATH || "../vault",
  },
};

module.exports = nextConfig;
