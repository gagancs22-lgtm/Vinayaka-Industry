// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  // Allow PDFKit and ExcelJS to run server-side
  serverExternalPackages: ["pdfkit", "exceljs", "bcryptjs"],
};

export default nextConfig;
