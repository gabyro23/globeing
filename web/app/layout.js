import "./globals.css";
import SiteHeader from "../components/SiteHeader";

export const metadata = {
  title: "Globeing — Compare Countries",
  description: "Compara países por economía, demografía y más.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
