/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // unpdf uses Node.js workers and cannot run in the Edge runtime.
    // This keeps it server-side only.
    serverComponentsExternalPackages: ["unpdf"],
  },
};

export default nextConfig;
