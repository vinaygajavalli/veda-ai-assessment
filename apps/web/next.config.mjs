/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile the workspace TS package instead of expecting a prebuilt dist.
  transpilePackages: ["@veda/shared"],
};

export default nextConfig;
