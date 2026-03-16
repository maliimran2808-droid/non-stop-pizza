import type { Metadata } from "next";
import { Geist, Geist_Mono, Raleway, Poppins } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import LoadingScreen from "@/components/LoadingScreen";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomCartBar from "@/components/BottomCartBar";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-heading",
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["900"],
});
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400"],
});


export const metadata: Metadata = {
  title: "NonStop Pizza | Best Pizza Delivery",
  description:
    "Order delicious pizzas, burgers, and fast food online. Fast delivery to your doorstep!",
  keywords: "pizza, fast food, delivery, nonstop pizza, order online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
   <body
  className={`${geistSans.variable} ${geistMono.variable} ${raleway.variable} ${poppins.variable} antialiased`}
>
        <ThemeProvider>
          <LoadingScreen />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              },
              success: {
                iconTheme: {
                  primary: '#16a34a',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#ffffff',
                },
              },
            }}
          />
          <Header />
          <main>{children}</main>
          <Footer />
          <BottomCartBar />
        </ThemeProvider>
      </body>
    </html>
  );
}