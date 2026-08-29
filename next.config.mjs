/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/jungwon',
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['exceljs'],
  },
};

export default nextConfig;
