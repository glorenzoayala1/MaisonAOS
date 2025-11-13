# Maison Mirror (HEY ZO Smart Mirror)

A smart mirror interface for MaisonOS: a wall-mounted display that shows essential widgets (time, weather, and today's plans) on a black background behind a two-way mirror. Controlled from a mobile-friendly admin page.

## v1 Scope

- Mirror display:
  - Digital clock + date
  - Weather widget (based on configured location)
  - "Today" widget showing a simple list of tasks/events
- Admin panel (mobile-friendly):
  - Set location for weather
  - Toggle widgets on/off
  - Edit "Today" list
- Backend:
  - Stores config locally on the device (JSON file)
  - Serves:
    - Mirror UI at `/mirror`
    - Admin UI at `/admin`
    - Config API (`GET/POST /config`)

No AI, no voice assistant, no external auth in v1.

## Tech Stack

- Frontend: React + TypeScript (Vite)
- Backend: FastAPI (Python)
- Target device: Raspberry Pi running in kiosk mode

## High-Level Architecture

- `mirror-client`:
  - React app with two main screens:
    - `/mirror`: full-screen black UI with widgets
    - `/admin`: basic settings dashboard
  - Uses `/config` API to read + write settings

- `mirror-server`:
  - FastAPI app exposing:
    - `GET /config` – return current config
    - `POST /config` – update config
    - `GET /weather` – proxy to a weather API
  - Stores config in `config.json` on the device

## v1 Milestones

1. UI Skeleton (mirror layout)
2. Local Config + Toggle Logic
3. Backend Integration
4. Admin Panel
5. Weather Integration

