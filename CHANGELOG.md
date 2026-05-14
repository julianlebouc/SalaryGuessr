# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-beta] - 2026-05-14

### Added
- **Core Game Modes**:
  - Classic Mode: Estimate salaries of real job offers.
  - High / Low: Guess if the next offer's salary is higher or lower.
  - Battle Royale: Real-time multiplayer elimination mode.
- **Features**:
  - Integration with France Travail API for real-time job offers.
  - Interactive dashboard with stats and graphs (using Recharts).
  - Industrial "Midnight" design system with animations (Framer Motion).
  - Sound system with adjustable volume.
  - Responsive layout for mobile and desktop.
- **Infrastructure**:
  - FastAPI backend with WebSocket support for multiplayer.
  - React 19 frontend.
  - Automated setup and start scripts (Windows/Linux).
  - Comprehensive documentation (JSDoc/Sphinx).
  - Robust test suite: Vitest (Frontend), Pytest (Backend).
  - Unified testing scripts (test.bat / test.sh) with coverage reporting.
