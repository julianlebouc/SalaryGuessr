# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1-beta] - 2026-05-16

### Fixed
- **Description Cleaning**: Restored missing salary censoring function in the backend.

## [0.2.0-beta] - 2026-05-15

### Added
- **Game Settings**: Implemented a real-time settings system allowing users to toggle between monthly/yearly salary units and adjust global volume.
- **Backend Tests**: Comprehensive test suite using Pytest covering API endpoints, salary parsing logic, and offer pool management.

### Improved
- **Salary Parsing**: Refactored extraction logic to accurately handle hourly wages, multi-rate offers, and improved noise filtering (e.g., ignoring technical codes like "CCN 66").
- **Offer Pool**: Optimized the job offer ingestion and filtering pipeline for better distribution and data quality.

## [0.1.1-beta] - 2026-05-15

### Fixed
- **Analytics**: Restored missing game start logs in Classic and High/Low modes.
- **Stats**: Fixed an issue where the global number of played games was not incrementing in the statistics dashboard.

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
