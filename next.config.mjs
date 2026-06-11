/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // football-data.org serves team crests from here
    remotePatterns: [
      { protocol: "https", hostname: "crests.football-data.org" },
      { protocol: "https", hostname: "**.football-data.org" },
    ],
  },
};

export default nextConfig;
