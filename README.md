# Earthquake Tracker

A real-time earthquake tracking system for Turkey and the world, aggregating data from Kandilli Observatory, AFAD, and EMSC sources.

## Features

- **Interactive Map**: Real-time visualization of earthquakes on an interactive map
- **Multiple Data Sources**: Kandilli Observatory, AFAD, and EMSC integration
- **Advanced Filtering**: Filter by date range, magnitude, depth, and source
- **Statistics**: Detailed statistics and analysis for selected areas
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Map Styles**: Light, satellite, and terrain map options
- **Tectonic Plates & Faults**: Visualization of tectonic plate boundaries and fault lines

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Mapping**: Leaflet.js & React-Leaflet
- **Visualization**: Recharts
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI & Headless UI
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/evoise/earthquake.git
cd earthquake

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SITE_URL=https://deprem.live
GOOGLE_SITE_VERIFICATION=your-verification-code
```

## Project Structure

```
/app
  /api          - API routes
  layout.tsx    - Root layout with SEO metadata
  page.tsx      - Main page
  manifest.ts   - PWA manifest
  robots.ts     - robots.txt
  sitemap.ts    - sitemap.xml

/components
  MapView.tsx         - Main map component
  EarthquakeList.tsx  - Earthquake list component
  FilterPanel.tsx     - Filter controls
  SettingsPanel.tsx   - Map settings
  Sidebar.tsx         - Navigation sidebar

/lib
  /api              - API integration modules

/public
  logo.png           - Site logo
  tectonic-plates.geojson
  turkey-faults.geojson
  turkey-cities.json
```

## License

See [LICENSE](LICENSE) file for details.

## Author

**evoise**

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

---

Built with ❤️ for earthquake awareness and safety.

