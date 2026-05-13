/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';

const nextConfig = {
  // Remove static export so server-side features (dynamic routes) work in Docker
  // output: "export",
  trailingSlash: true,

  // Proxy all /api/* requests to Express backend — runs before pages/api/ resolution
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      ],
    };
  },
  images: {
    unoptimized: true,
    domains: ["gateway.pinata.cloud"],
  },
  // Webpack config – stub Node built-ins + block all wallet/Ethereum packages
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Stub Node built-ins that don't exist in the browser.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
      };

      // Hard-block every wallet / Ethereum package from being bundled.
      // None of these are imported by application code; this is a safety net
      // in case any stale transitive dependency tries to pull them in.
      const walletPackages = [
        'wagmi',
        '@wagmi/core',
        '@wagmi/connectors',
        '@rainbow-me/rainbowkit',
        '@coinbase/wallet-sdk',
        '@coinbase/cdp-sdk',
        '@walletconnect/universal-provider',
        '@walletconnect/ethereum-provider',
        '@reown/appkit',
        'viem',
        'ethers',
        '@ethersproject/providers',
        '@gemini-wallet/core',
        '@base-org/account',
      ];
      walletPackages.forEach((pkg) => {
        config.resolve.alias[pkg] = false;
      });
    }
    return config;
  },
};

module.exports = nextConfig;
