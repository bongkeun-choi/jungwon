/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/jungwon',
  assetPrefix: '/jungwon/',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
