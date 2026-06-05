import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        // note: if you are not logged in, you further get redirected from /dashboard to /auth/sign-in (see proxy.ts)
        destination: '/dashboard',
        permanent: true
      }
    ];
  }
};

export default nextConfig;
