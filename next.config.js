/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  transpilePackages: [
    "@ant-design",
    "rc-picker",
    "rc-util",
    "rc-pagination"
  ],
  experimental: {
    esmExternals: 'loose',
  },
}
 
export default nextConfig
