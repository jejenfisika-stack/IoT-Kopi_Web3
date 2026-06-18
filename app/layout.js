import './globals.css'

export const metadata = {
  title: 'Kopi IoT Web3 — Monitoring, Forecasting & Blockchain',
  description: 'Dashboard sensor kebun kopi (NodeMCU + DHT11 + Soil Moisture) dengan forecasting dan pencatatan ringkasan harian ke Polygon Amoy.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
