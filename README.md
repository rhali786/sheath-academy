# Sheath Academy

A modular web application built with Python backend and React frontend.

## Project Structure

```
sheath-academy/
├── features/                          # Feature modules
│   ├── dashboard/                     # Dashboard feature
│   │   ├── config.json               # Feature config and version
│   │   ├── data/                     # Feature-specific JSON database
│   │   ├── frontend/                 # React UI for dashboard
│   │   │   └── src/
│   │   └── backend/                  # Python API for dashboard
│   │       └── app/
│   └── login/                         # Authentication feature
│       ├── config.json               # Feature config and version
│       ├── data/                     # Feature-specific JSON database
│       ├── frontend/                 # React UI for login
│       │   └── src/
│       └── backend/                  # Python API for login
│           └── app/
├── shared/                            # Shared resources
│   ├── config/
│   │   └── features.json             # Feature registry (for Claude discovery)
│   └── utils/                        # Shared utilities
├── config.json                        # Root application config
├── README.md                          # This file
└── CLAUDE.md                          # Development documentation
```

### Feature Architecture

Each feature is independent and self-contained:
- **Config**: Version, dependencies, database location, port assignments
- **Data**: JSON files stored in `features/[feature]/data/`
- **Frontend**: React components in `features/[feature]/frontend/`
- **Backend**: Python API in `features/[feature]/backend/`

### Feature Discovery

`shared/config/features.json` maps all features and their locations. When one feature needs to connect to another (e.g., dashboard calling login API), this config file provides the URL and path without runtime discovery.

## Features

Each feature is self-contained with its own frontend and backend:
- **Login**: Authentication and user management
- **Dashboard**: Main application dashboard

## Development

- **Backend**: Python (FastAPI)
- **Frontend**: React with Tailwind CSS and shadcn/ui
- **Storage**: JSON-based file storage

### Getting Started

1. See individual feature READMEs in `features/*/README.md`
2. Configuration references in `config.json` and `shared/config/features.json`

