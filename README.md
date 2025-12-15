# Flyby ✈️

Real-time flight tracking application with push notifications when planes fly overhead.

![Flyby Screenshot](docs/screenshot.png)

## Features

- 🗺️ **Live Flight Map** - Track aircraft in real-time on an interactive map
- ✈️ **Flight Details** - View altitude, speed, route, and aircraft information
- 🔔 **Overhead Alerts** - Get push notifications when planes fly over your location
- 📱 **ntfy Integration** - Self-hosted push notifications via [ntfy](https://ntfy.sh)
- 🐳 **Docker Ready** - Easy self-hosting with Docker Compose

## Quick Start (Docker)

The easiest way to run Flyby is with Docker Compose:

```bash
# Clone the repository
git clone https://github.com/yourusername/flyby.git
cd flyby

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your API credentials and home coordinates

# Start the services
docker-compose up -d
```

Access the app at `http://localhost:3000`

## Configuration

Copy `.env.example` to `.env` and configure:

### Required
| Variable | Description |
|----------|-------------|
| `VITE_OPENSKY_CLIENT_ID` | OpenSky Network username |
| `VITE_OPENSKY_CLIENT_SECRET` | OpenSky Network password |

### Optional
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_FR24_API_KEY` | FlightRadar24 API key for enhanced details | - |
| `VITE_NTFY_URL` | ntfy server URL | `http://ntfy:80` |
| `VITE_NTFY_TOPIC` | ntfy topic name | `flyby-alerts` |
| `VITE_HOME_LAT` | Your home latitude | - |
| `VITE_HOME_LON` | Your home longitude | - |
| `VITE_NOTIFICATION_RADIUS_KM` | Alert radius in km | `10` |

## Push Notifications with ntfy

Flyby uses [ntfy](https://ntfy.sh) for push notifications. When running with Docker Compose, ntfy is automatically included.

### Subscribe to notifications

1. Install the ntfy app on your phone ([iOS](https://apps.apple.com/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy))
2. Subscribe to your server's topic: `http://<your-server>:8080/flyby-alerts`
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
- **OpenSky Network API** for flight data
- **FlightRadar24 API** for enhanced flight details
- **ntfy** for push notifications
- **nginx** for production serving

## API Credits

- [OpenSky Network](https://opensky-network.org/) - Live flight positions
- [FlightRadar24](https://www.flightradar24.com/) - Flight details and routes
- [Planespotters.net](https://www.planespotters.net/) - Aircraft photos

## License

MIT
