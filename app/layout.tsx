import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: {
    default: "Deprem Takip Sistemi",
    template: "%s | Deprem Takip Sistemi",
  },
  description: "Türkiye ve dünyada meydana gelen depremleri Kandilli Rasathanesi, AFAD ve EMSC kaynaklarından canlı olarak takip edin. İnteraktif harita, detaylı istatistikler ve gerçek zamanlı bildirimler ile depremleri izleyin.",
  keywords: ["deprem", "deprem takip", "deprem haritası", "türkiye depremleri", "kandilli", "afad", "deprem istatistikleri", "deprem uyarı", "sismograf", "deprem verisi"],
  authors: [{ name: "evoise" }],
  creator: "evoise",
  publisher: "evoise",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://deprem.live'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://deprem.live',
    title: 'Deprem Takip Sistemi',
    description: 'Türkiye ve dünyada meydana gelen depremleri Kandilli Rasathanesi, AFAD ve EMSC kaynaklarından canlı olarak takip edin.',
    siteName: 'Deprem Takip Sistemi',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Deprem Takip Sistemi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deprem Takip Sistemi',
    description: 'Türkiye ve dünyada meydana gelen depremleri Kandilli Rasathanesi, AFAD ve EMSC kaynaklarından canlı olarak takip edin.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={poppins.variable}>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link
          rel="stylesheet"
          href="https://site-assets.fontawesome.com/releases/v7.1.0/css/all.css"
        />
        <link
          rel="stylesheet"
          href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-solid.css"
        />
        <link
          rel="stylesheet"
          href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-regular.css"
        />
        <link
          rel="stylesheet"
          href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-light.css"
        />
        <link
          rel="stylesheet"
          href="https://site-assets.fontawesome.com/releases/v7.1.0/css/duotone.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Deprem Takip Sistemi',
              description: 'Türkiye ve dünyada meydana gelen depremleri Kandilli Rasathanesi, AFAD ve EMSC kaynaklarından canlı olarak takip edin.',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://deprem.live',
              applicationCategory: 'UtilityApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'TRY',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '5',
                ratingCount: '1',
              },
            }),
          }}
        />
      </head>
      <body className="antialiased bg-black text-white">
        {children}
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
        )}
      </body>
    </html>
  );
}

