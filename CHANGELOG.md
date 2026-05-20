# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.6-beta] - 2026-05-20

### Fixed
- **Salary Parsing**: Removed hourly rate parsing because part time jobs could not be correctly handled

### Changed
- **Legal Mentions**: Updated legal mentions to reflect current data processing and be GDPR compliant

## [0.3.5-beta] - 2026-05-18

### Fixed
- **Salary Parsing**: Implemented more robust salary parsing method to avoid mistakes in salary values

## [0.3.4-beta] - 2026-05-18

### Fixed
- **Mobile phone display**: Modified container heights to avoid needing to scroll down to access main input fields and buttons
- **Salary guess value differences**: Fixed unvoluntary average of salary guess when in annual mode

## [0.3.3-beta] - 2026-05-17

### Added
- **Server-side Score Tracking**: Scores are no longer submitted by the client. The server now issues a session token at game start, accumulates per-round scores on each `/validate` call, and computes the final score on `/game_over`.
- **Rate Limiting**: Added per-IP rate limits on all game endpoints (`/job`, `/validate`, `/log`, `/game_over`) via `slowapi`.
- **Admin Key Protection**: The `/reset` endpoint now requires a secret `X-Admin-Key` header.

### Fixed
- **Log Injection**: The `/log` endpoint now rejects any message not in an explicit allowlist and strips score-related fields from the context, preventing stat manipulation via crafted requests.

### Security
- Socket.IO CORS origin changed from `*` to the configured `CORS_ORIGINS` value.

## [0.3.2-beta] - 2026-05-17

### Added
- **Salary Distribution**: Implemented natural pool binning logic (50€ intervals) to ensure a more even and diverse mathematical distribution of job offers across the entire salary range.

### Improved
- **Responsive Layouts**: Optimized content display, container gaps, margins, paddings, and heights to maximize screen real estate and fit more content cleanly on both mobile and desktop views.
- **Salary Masking**: Simplified the salary censoring in job descriptions by masking all numeric characters to prevent edge case leaks, and added strict masking for all "smic" references.

### Fixed
- **Pro Theme Legibility**: Fixed an issue in `GamePage` and `StatsPage` where graph legends and values were not visible when using the Professional theme.

## [0.3.1-beta] - 2026-05-16

### Improved
- **Mobile Phone Reponsive**: Minimized header size and reduced margins to fit more content on screen

## [0.3.0-beta] - 2026-05-16

### Added
- **Theme System**: Three visual themes — Classic (default purple dark), Retro (neon synthwave), Professional (light LinkedIn-inspired).
- **Theme Switcher**: Settings popup now offers a 3-way toggle between Classic / Retro / Pro themes.
- **Onboarding Tutorial**: First-time visitors see a 4-step guided tour covering website intro, game modes explanation, live theme/settings customization, and where to find settings.
- **Classic Theme**: New base theme that restores the original clean dark look without retro neon overrides.

### Changed
- **Default Theme**: Changed from `retro` to `classic` for new users.
- **Settings Volume Slider**: Now uses CSS variables (`--primary-purple`) instead of hardcoded retro colors, adapting to the active theme.

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
