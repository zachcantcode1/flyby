# Flyby ✈️

Real-time flight tracking application with push notifications when planes fly overhead.

## Features

- 🗺️ **Live Flight Map** - Track aircraft in real-time with 2-second updates
- ✈️ **Rich Flight Details** - Registration, aircraft type, operator, altitude, speed
- 🔔 **Overhead Alerts** - Push notifications when planes fly over your location
- 📱 **ntfy Integration** - Self-hosted push notifications via [ntfy](https://ntfy.sh)
- 🐳 **Docker Ready** - Easy self-hosting with Docker Compose
- 🆓 **Free Data** - Uses [Airplanes.live](https://airplanes.live) API (no account required!)

## Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/yourusername/flyby.git
cd flyby

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your home coordinates for notifications

# Start the services
docker-compose up -d
```

Access the app at `http://localhost:3000`

## Configuration

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_FR24_API_KEY` | FlightRadar24 API key (optional, for enhanced details) | - |
| `VITE_NTFY_URL` | ntfy server URL | `https://ntfy.sh` |
| `VITE_NTFY_TOPIC` | ntfy topic name | `flyby-alerts` |
| `VITE_HOME_LAT` | Your home latitude | - |
| `VITE_HOME_LON` | Your home longitude (use negative for West!) | - |
| `VITE_NOTIFICATION_RADIUS_KM` | Alert radius in km | `10` |

## Push Notifications with ntfy

Flyby uses [ntfy](https://ntfy.sh) for push notifications. When running with Docker Compose, ntfy is automatically included.

### Subscribe to notifications

1. Install the ntfy app on your phone ([iOS](https://apps.apple.com/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy))
2. Subscribe to your topic (default: `flyby-alerts`) on `ntfy.sh` or your server
3. Configure your home coordinates in `.env`
4. Receive notifications when planes fly overhead! ✈️

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **React 19** + TypeScript + Vite
- **Leaflet** for maps
- **Tailwind CSS** + shadcn/ui
- **Airplanes.live API** for live flight data (free, no auth!)
- **FlightRadar24 API** for enhanced flight details
- **ntfy** for push notifications
- **nginx** + Docker for production

## API Credits

- [Airplanes.live](https://airplanes.live/) - Live flight positions (unfiltered ADS-B)
- [FlightRadar24](https://www.flightradar24.com/) - Flight details and routes
- [Planespotters.net](https://www.planespotters.net/) - Aircraft photos

## License

MIT

