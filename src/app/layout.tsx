import type { Metadata } from "next";
import { Geist, Geist_Mono, Raleway, Poppins, DM_Sans, JetBrains_Mono } from "next/font/google";
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

const ralewayLight = Raleway({
  variable: "--font-raleway-light",
  subsets: ["latin"],
  weight: ["500"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
 weight: ["300", "400", "500", "600", "700"]
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${raleway.variable} ${dmSans.variable} ${jetBrainsMono.variable} antialiased`}
>
        <ThemeProvider>
          <LoadingScreen />
                   <Toaster
            position="bottom-center"
            containerStyle={{
              bottom: 70,
            }}
            toastOptions={{
              duration: 2000,
              style: {
                background: '#16a34a',
                color: 'white',
                fontFamily:'Poppins',
                borderRadius: '16px',
                padding: '12px 20px',
                fontSize: '11px',
                fontWeight: '600',
              
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