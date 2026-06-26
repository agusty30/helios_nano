/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    return [
      { source: "/v1/:path*", destination: `${backendUrl}/v1/:path*` },
      { source: "/nano", destination: `${backendUrl}/nano` },
      { source: "/hello-world", destination: `${backendUrl}/hello-world` },
    ];
  },
};

module.exports = nextConfig;
