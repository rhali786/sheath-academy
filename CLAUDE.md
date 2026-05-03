# Claude Development Guide

Document your codebase context, conventions, and setup instructions here.

## Project Overview

(To be filled in)

## Architecture

### Data Storage

- **Type**: JSON file-based (no database dependency)
- **Location**: Each feature has its own `data/` directory
  - Login database: `features/login/data/login.json`
  - Dashboard database: `features/dashboard/data/dashboard.json`
  - Future features will follow the same pattern

### Feature Discovery

- **Static Configuration**: Use `shared/config/features.json` to find other features
- **No Runtime Discovery**: Feature locations are determined at Claude time via config files
- **Feature Interdependencies**: Defined in each feature's `config.json` under `dependencies`

## Development Setup

(To be filled in)

## Key Conventions

(To be filled in)

## Feature Dependencies

(To be filled in)

