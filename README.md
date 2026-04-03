# Avtonostalgija 80&90

Modern retro Slovenian car culture platform powered by Strapi v5.

## Project Overview

Avtonostalgija 80&90 is a community-driven platform dedicated to preserving and celebrating the car culture of the 1980s and 1990s in Slovenia. The platform connects enthusiasts, provides historical context, and organizes events related to youngtimer and oldtimer vehicles.

## Features

- **Event Management**: Real-time announcements and event details for car meetings and group visits.
- **News & Articles**: Curated content about Slovenian car culture, technical heritage, and community stories.
- **Gallery**: High-quality photo galleries of classic vehicles and past events.
- **Membership**: Integrated membership registration system for community members.
- **Multi-language Support**: Available in Slovenian (SI) and English (EN).
- **Modern Retro UI**: A distinctive design inspired by the 80s and 90s aesthetic, featuring neon accents and glassmorphism.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion (motion/react)
- **Backend Integration**: Strapi v5 (Headless CMS)
- **Communication**: EmailJS for form submissions

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

The project uses the following environment variables (to be configured in `.env`):

- `GEMINI_API_KEY`: API key for Gemini AI integration (if applicable).
- `VITE_EMAILJS_PUBLIC_KEY`: Public key for EmailJS.
- `VITE_STRAPI_BASE_URL`: Base URL for the Strapi CMS.

## GitHub Integration

If you encounter the error "Failed to push commit to GitHub. Please try again.", check the following:

1. **.gitignore**: Ensure `node_modules` and `dist` are excluded. This project now includes a `.gitignore` to fix this common issue.
2. **Authentication**: Go to the **Settings** menu in AI Studio and ensure your GitHub account is properly connected. You may need to disconnect and reconnect if the token has expired.
3. **Repository Permissions**: Ensure you have write access to the target repository and that it is not archived.
4. **Remote Branch**: Ensure the branch you are pushing to exists on the remote or that you have permission to create it.
5. **Sync**: If there are remote changes, you may need to pull them first. You can use the `git:check` script in `package.json` to inspect the remote state.

## License

© 2026 AVTONOSTALGIJA 80&90. All rights reserved.
