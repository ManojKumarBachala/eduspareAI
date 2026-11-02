import "./globals.css";
import type { Metadata } from "next";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "New Little Flower EM School | Wyra",
  description: "New Little Flower EM School, Wyra, Khammam, Telangana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">
            {children}
          </div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
