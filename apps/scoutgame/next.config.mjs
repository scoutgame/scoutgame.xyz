import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  // serwist is currently not compatible with turbopack
  disable: process.env.NODE_ENV !== 'production',
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  swUrl: '/sw.js'
});

/** @type {import('next').NextConfig} */

// Next.js requires this configured at build and run time
const useCDN =
  process.env.CI || process.env.REACT_APP_APP_ENV === 'production' || process.env.REACT_APP_APP_ENV === 'staging';

const nextConfig = {
  // types are tested separately from the build
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: true
  },
  productionBrowserSourceMaps: true,
  assetPrefix: useCDN ? 'https://cdn.charmverse.io' : undefined,
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    }
  },
  webpack(_config) {
    // Fix for: "Module not found: Can't resolve 'canvas'"
    // _config.resolve.alias.canvas = false;

    _config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgoConfig: {
              // dont remove viewBox which allows svg to scale properly
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: { removeViewBox: false }
                  }
                }
              ]
            }
          }
        }
      ]
    });
    return _config;
  },
  async redirects() {
    return [
      {
        source: '/builders',
        destination: '/developers',
        permanent: true
      },
      {
        source: '/info/builders',
        destination: '/info/developers',
        permanent: true
      },
      {
        source: '/info/builder-nfts',
        destination: '/info/developer-nfts',
        permanent: true
      }
    ];
  }
};

export default withSerwist(nextConfig);
