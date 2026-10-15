# Smart Campus API

## Run

1. Copy `env.sample` to `.env` and set `MONGO_URI` to the MongoDB connection string and `JWT_SECRET` to a long, random secret.
2. Install dependencies with `npm install`.
3. Start the API with `node server.js`.

The API listens on port `3000` by default. Set `PORT` to change it. For a physical phone, set `EXPO_PUBLIC_API_BASE_URL` in `MyApp/.env` to the computer's LAN address, for example `http://192.168.1.20:3000`.

## Authentication

- `POST /api/auth/register`: accepts `studentId`, `name`, `email`, and `password`; creates a MongoDB user and returns a token and public user profile.
- `POST /api/auth/login`: accepts `email` and `password`; returns a token and public user profile.
- `GET /api/auth/me`: returns the current profile. Send the token in `Authorization: Bearer <token>`.

Passwords are bcrypt-hashed. Email and student ID must be unique, and passwords must contain at least 8 characters.