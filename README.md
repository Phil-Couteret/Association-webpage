# Elektr-Âme Website

Official website for **Elektr-Âme**, an electronic music community and association based in Barcelona.

[![Tech Stack](https://img.shields.io/badge/React-TypeScript-blue)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/PHP-8.4-purple)](https://www.php.net/)
[![Build](https://img.shields.io/badge/Vite-5.x-yellow)](https://vitejs.dev/)

---

## 🎵 About

Elektr-Âme is a music association focused on developing electronic music projects, hosting events, and building a community of artists and enthusiasts in Barcelona.

**Live Site:** [https://www.elektr-ame.com](https://www.elektr-ame.com)

---

## ✨ Features

- **Multi-language Support** (English, Spanish, Catalan)
- **Event Management** - Create and showcase upcoming events
- **Artist Profiles** - Individual pages with galleries for each artist
- **Gallery System** - Organized by events, artists, and general categories
- **Member Portal** - Membership management and authentication
- **Admin Dashboard** - Complete CMS for content management
- **Newsletter System** - Subscriber management and campaigns
- **Email Automation** - Automated member communications
- **Progressive Web App** - Installable on mobile devices

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PHP 8.4+
- MySQL 8.0+

### Installation

```bash
# Clone the repository
git clone https://github.com/Phil-Couteret/elektr-ame-website.git
cd elektr-ame-website

# Install dependencies
npm install

# Configure database
cp api/config-template.php api/config.php
# Edit api/config.php with your database credentials

# Start development server
npm run dev
```

Visit `http://localhost:8080`

---

## 📚 Documentation

- **[Project Structure](PROJECT_STRUCTURE.md)** - Detailed folder organization
- **[Deployment Guide](deployment/FINAL_DEPLOYMENT_STEPS.md)** - Production deployment instructions
- **[Database Migrations](database/)** - SQL scripts for schema setup

---

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui component library
- React Router for navigation

### Backend
- PHP 8.4
- MySQL 8.0
- PDO for database access
- RESTful API architecture

### Deployment
- OVH Shared Hosting
- FTP deployment
- PWA with service worker

---

## 📂 Project Structure

```
elektr-ame-website/
├── src/              # React frontend source
├── api/              # PHP backend endpoints
├── database/         # SQL migration scripts
├── deployment/       # Production-ready files
├── public/           # Static assets & uploads
└── dist/             # Build output (auto-generated)
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed documentation.

---

## 🔨 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality
```

---

## 🚢 Deployment

Production files are in the `deployment/` folder. See [deployment/FINAL_DEPLOYMENT_STEPS.md](deployment/FINAL_DEPLOYMENT_STEPS.md) for complete deployment instructions.

---

## 👥 Contributing

When contributing:
1. Create a feature branch
2. Make your changes
3. Test locally
4. Build and verify
5. Create a pull request

---

## 📄 License

© 2025 Elektr-Âme Association. All rights reserved.

---

## 💬 Contact

For questions or collaboration opportunities, visit [www.elektr-ame.com](https://www.elektr-ame.com)
