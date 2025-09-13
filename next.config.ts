import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Configuración para manejar módulos de Node.js en el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser'),
      };

      // Configuración de plugins para polyfills
      config.plugins.push(
        new (require('webpack')).ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }


    return config;
  },
  
  // Configuración experimental para manejar módulos ESM
  experimental: {
    esmExternals: 'loose',
  },
  

  // Configuración de headers para solucionar Cross-Origin-Opener-Policy
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  },

  // Configuración para evitar conflictos de React hooks
  reactStrictMode: false,
};

export default nextConfig;
