import { Calistoga } from "next/font/google";
import "./globals.css";
import SiteHeader from "../components/SiteHeader";

const calistoga = Calistoga({ subsets: ["latin"], weight: "400", variable: "--font-calistoga" });

export const metadata = {
  title: "Globeing — Compare Countries",
  description: "Compare countries by economy, demographics, and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full ${calistoga.variable}`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
