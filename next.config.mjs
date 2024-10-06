/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // Warning: This allows production builds to successfully complete even if
      // your project has ESLint errors.
      ignoreDuringBuilds: true,
    },
    async headers() {
        return [
          {
            source: '/:path*',
            headers: [
              { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
              { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
            ],
          },
        ];
    },
};

export default nextConfig;
