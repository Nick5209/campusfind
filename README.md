# CampusFind

A first working slice of the CampusFind lost-and-found Progressive Web App.

## Included

- Responsive home page with Lost, Found, and All filters
- Search by title, category, description, or location
- Create item listings and save them to MongoDB
- Mark a listing resolved or reopen it
- PWA manifest, install prompt, app icon, and cached app shell
- Express API with basic input validation

## Requirements

- Node.js 20 or newer
- MongoDB running locally, or a MongoDB connection URI

## Run locally

1. Open a terminal in this folder.
2. Install packages: `npm install`
3. Copy `.env.example` to `.env` and set `MONGODB_URI` if your MongoDB is not at the local default.
4. Start the app: `npm start`
5. Open `http://localhost:3001`.

The app needs HTTPS for PWA installation outside localhost. Authentication and private claim/contact requests are not in this first slice yet.

