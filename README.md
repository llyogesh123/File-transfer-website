# Real-Time File Transfer Application

A full-stack web application that lets registered users send files to each other in real time with Socket.IO streaming, encrypted storage, and Tailwind-styled UI.

## Features

* User registration & JWT-based authentication
* Chunked, real-time file streaming between sender and recipient using Socket.IO
* Transfer progress bars for both sides
* Unique 8-character transfer codes
* History tab that separates **Pending**, **Sent**, **Received** files, with secure download links
* File deletion (sender or recipient)
* Tailwind CSS, fully responsive (mobile → desktop)
* Backend REST API + WebSocket built with Express, MongoDB & Mongoose
* Deployed backend: [`https://file-transfer-website-2.onrender.com`](https://file-transfer-website-2.onrender.com)

## Tech Stack

| Layer      | Tech                                |
|------------|-------------------------------------|
| Front-end  | React + TypeScript, Vite, Tailwind  |
| Real-time  | Socket.IO v4                        |
| Back-end   | Node.js, Express, Mongoose          |
| Database   | MongoDB Atlas                       |
| Deploy     | Render.com (backend)                |

---

## Local Development

### Prerequisites

* Node >= 18
* npm >= 9
* MongoDB instance (local or Atlas)

### Clone & Install

```bash
# clone
git clone https://github.com/<your-user>/file-transfer-application.git
cd file-transfer-application

# install root deps (concurrently etc.)
npm install

# install frontend & backend deps
cd frontend && npm install && cd ..
cd backend  && npm install && cd ..
```

### Environment Variables

Create **two** `.env` files:

`/backend/.env`
```
PORT=3001
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/filedb
JWT_SECRET=<long-random-string>
CLIENT_URL=http://localhost:5173
```

`/frontend/.env`
```
VITE_API_URL=http://localhost:3001
```

### Run Dev Servers

```bash
# from project root
npm run dev            # runs backend (nodemon) & frontend (Vite) concurrently
```
Open `http://localhost:5173`.

---

## Production Deployment

### Backend on Render

1. Create a new **Web Service**
2. Build Command: `npm install`
3. Start Command: `node index.js`
4. Environment Vars: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`

### Frontend on Netlify / Vercel / Render Static

1. Set `VITE_API_URL` to the Render backend URL
2. Build Command: `npm run build`
3. Publish Dir: `dist`

---

## API Overview (Backend)

| Method | Endpoint                               | Description                          |
|--------|----------------------------------------|--------------------------------------|
| POST   | `/api/auth/register`                   | Register a new user                  |
| POST   | `/api/auth/login`                      | Login & get JWT                      |
| GET    | `/api/files/my-files`                  | List files I sent                    |
| GET    | `/api/files/received-files`            | List files sent **to** me            |
| POST   | `/api/files/upload`                    | Upload new file                      |
| GET    | `/api/files/download/:code`            | Download completed transfer          |
| DELETE | `/api/files/:id`                       | Delete file (sender/recipient)       |

Socket.IO rooms:
* `transfer_progress` – emits `{progress, chunkIndex, totalChunks}`

---

## Scripts

At repo root:

| Script   | Purpose                                  |
|----------|------------------------------------------|
| `npm run dev`  | Start backend (nodemon) & frontend (Vite) |
| `npm run lint` | ESLint across workspace                 |
| `npm run build` (front) | Production build of React app |

---

## License

MIT © 2025 Yogeshwaran R
