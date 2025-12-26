/** Minimal Next.js configuration for incremental migration */
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  // keep permissive during migration; tighten as needed
  images: {
    domains: ['*'],
  },
};