import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production'
const internalHost = process.env.TAURI_DEV_HOST || 'localhost'

const nextConfig: NextConfig = {
  // Essential configuration for Tauri compatibility
  output: 'export',
  
  // Static export configuration
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Asset prefix for development
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
