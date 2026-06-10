// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  reactStrictMode: true,
  
  // Image optimization
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 375, 425, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: false,
  },
  
  // Performance
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  
  // Allow PDFKit and ExcelJS to run server-side
  serverExternalPackages: ["pdfkit", "exceljs", "bcryptjs"],
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-*"],
  },
};

export default nextConfig;
