import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocuGraph AI",
  description: "Multi-layer Knowledge Assistant – Học thông minh hơn với AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

