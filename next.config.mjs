/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mongoose"],
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
