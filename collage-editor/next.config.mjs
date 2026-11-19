/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Konva nodes are created imperatively; double-mount only adds noise in dev
  webpack: (config) => {
    // konva's node build optionally requires `canvas`; the editor only runs in the browser
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};
export default nextConfig;
