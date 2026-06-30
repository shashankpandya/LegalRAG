/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // unpdf uses Node.js workers and cannot run in the Edge runtime.
    // This keeps it server-side only.
    serverComponentsExternalPackages: ["unpdf"],
  },
  // Compress responses
  compress: true,
  // Optimise images even though we don't use next/image yet
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Inline small CSS files instead of separate requests
  optimizeFonts: true,
  // Remove console.* in production builds (keeps errors)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
};

export default nextConfig;
