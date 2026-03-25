import type { NextConfig } from "next";
import path from "path";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zoogfqvckgglbediccwe.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  transpilePackages: ['@splinetool/react-spline', '@splinetool/runtime'],
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        module: false,
        perf_hooks: false,
        child_process: false,
        net: false,
        tls: false,
        dns: false,
        http2: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        constants: false,
        os: false,
        vm: false,
        worker_threads: false,
        tty: false,
        readline: false,
      };
    }
    return config;
  },
};

export default nextConfig;
