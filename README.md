# 🎬 CineStream

A full-stack movie streaming platform built as a university project. Streams public-domain films from **Internet Archive** and supports external streaming URLs (HLS, MP4, Streamtape, Vidstream, etc.).

---

## 📐 Architecture Overview

```
cinestream/
├── client/                   # Next.js + React frontend
│   └── src/
│       ├── components/
│       │   ├── layout/       # Navbar, Footer, Layout wrapper
│       │   ├── cards/        # MovieCard, MovieRow, HeroBanner
│       │   ├── player/       # VideoPlayer (HLS + MP4)
│       │   └── ui/           # Skeleton loaders
│       ├── context/          # AuthContext (JWT state)
│       ├── pages/
│       │   ├── index.js      # Homepage (Netflix-style)
│       │   ├── movie/[id].js # Movie detail + player
│       │   ├── search/       # Search + filter
│       │   ├── genre/[name]  # Genre browser
│       │   ├── admin/        # Admin CRUD panel
│       │   └── auth/         # Login + Register
│       ├── styles/           # Tailwind + global CSS
│       └── utils/            # Axios API helpers
│
└── server/                   # Express + MongoDB API
    ├── models/
    │   ├── Movie.js          # Movie schema
    │   └── User.js           # User schema + bcrypt
    ├── routes/
    │   ├── movies.js         # Public movie endpoints
    │   ├── auth.js           # Register / Login / JWT
    │   ├── users.js          # Favorites + Watch History
    │   └── admin.js          # Protected CRUD + stats
    ├── middleware/
    │   └── auth.js           # JWT protect + adminOnly guards
    ├── uploads/              # Poster image uploads (multer)
    ├── index.js              # Express entry point
    └── seed.js               # 20 public-domain movies
```

---

## 🎥 How Streaming Works

### Concept
CineStream does **not** host video files. Instead, each movie in the database stores a `streamUrl` pointing to an external hosting provider. When a user clicks "Watch Now", the frontend:

1. Fetches the movie record from MongoDB (which contains the `streamUrl`)
2. Passes the URL to the `VideoPlayer` component
3. The player detects whether the URL is:
   - **HLS** (`.m3u8` playlist) → loaded via `hls.js` library
   - **Direct MP4/WebM** → loaded directly into `<video src="...">`
4. Video bytes stream directly from the external provider to the user's browser

### Supported External Providers
| Provider | URL Format | Notes |
|----------|-----------|-------|
| Internet Archive | `https://archive.org/download/.../file.mp4` | Free, public domain |
| Direct MP4 | Any `.mp4` URL | CDN-hosted files |
| HLS Streams | `.m3u8` playlist URL | Via hls.js |
| Streamtape | `https://streamtape.com/e/...` | Embed URL |
| Vidstream | Embed URL | Embed in iframe |
| Doodstream | `https://dood.ws/e/...` | Embed URL |
| Filemoon | Embed URL | Embed in iframe |

> **Note for commercial providers (Streamtape, Vidstream, etc.):** These providers usually give you an embed URL, not a direct video URL. For these, you can add an `<iframe>` in the player instead of `<video>`. The current `VideoPlayer` component supports direct MP4 and HLS. To add iframe support, modify `VideoPlayer.jsx` to detect embed URLs and render an `<iframe>` instead.

### Example stream structures in DB:
```json
{
  "streamUrl": "https://archive.org/download/Nosferatu_201303/Nosferatu.mp4",
  "streamSources": [
    {
      "provider": "archive",
      "quality": "720p",
      "url": "https://archive.org/download/Nosferatu_201303/Nosferatu.mp4",
      "isHLS": false
    },
    {
      "provider": "streamtape",
      "quality": "1080p",
      "url": "https://streamtape.com/e/XXXXX",
      "isHLS": false
    }
  ]
}
```

---

## 🚀 Running Locally

### Prerequisites
- **Node.js** v18+
- **MongoDB** running locally (or MongoDB Atlas URI)
- **npm** or **yarn**

### Step 1 — Clone and install dependencies
```bash
git clone <repo-url>
cd cinestream

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Step 2 — Configure environment variables

**Server** (`server/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cinestream
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

**Client** (`client/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Step 3 — Seed the database
```bash
cd server
node seed.js
```
This inserts 20 public-domain movies and creates an admin account:
- **Email:** `admin@cinestream.com`
- **Password:** `admin123`

### Step 4 — Start the servers

**Terminal 1 — API server:**
```bash
cd server
npm run dev      # uses nodemon for hot reload
# OR
npm start        # production mode
```
Server runs at: `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```
Frontend runs at: `http://localhost:3000`

### Step 5 — Open in browser
Navigate to `http://localhost:3000`

---

## 🔑 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/movies` | List movies (supports `?search=`, `?genre=`, `?year=`, `?featured=true`, `?trending=true`) |
| GET | `/api/movies/:id` | Movie detail |
| GET | `/api/movies/:id/related` | Related movies |
| GET | `/api/movies/genres` | All genres list |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login → returns JWT |

### Protected (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Current user |
| GET | `/api/users/favorites` | User's favorites |
| POST | `/api/users/favorites/:id` | Toggle favorite |
| GET | `/api/users/history` | Watch history |
| POST | `/api/users/history/:id` | Record watch |

### Admin Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/movies` | All movies (including drafts) |
| POST | `/api/admin/movies` | Create movie (multipart/form-data) |
| PUT | `/api/admin/movies/:id` | Update movie |
| DELETE | `/api/admin/movies/:id` | Delete movie |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | All users |

---

## 🗄️ Database Schema

### Movie
```js
{
  title: String,
  description: String,
  genre: [String],
  year: Number,
  rating: Number (0-10),
  poster: String,           // URL or local /uploads/ path
  backdrop: String,
  duration: Number,         // minutes
  director: String,
  cast: [String],
  streamUrl: String,        // Primary stream URL
  streamSources: [{         // Multiple quality sources
    provider: String,
    quality: String,
    url: String,
    isHLS: Boolean
  }],
  isFeatured: Boolean,
  isTrending: Boolean,
  views: Number,
  isPublished: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### User
```js
{
  username: String,
  email: String,
  password: String,        // bcrypt hashed
  role: 'user' | 'admin',
  watchHistory: [{
    movie: ObjectId,
    watchedAt: Date,
    progress: Number       // 0-100%
  }],
  favorites: [ObjectId],
  createdAt: Date
}
```

---

## 🎨 UI Design

- **Theme:** Dark cinema aesthetic with deep blacks and red accents
- **Typography:** Bebas Neue (display/headings) + DM Sans (body)
- **Layout:** Netflix-style horizontal scroll rows on homepage
- **Responsive:** Mobile-first, works on all screen sizes
- **Animations:** Fade-in/slide-up transitions, shimmer skeletons

---

## ⌨️ Video Player Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` / `K` | Play / Pause |
| `F` | Toggle Fullscreen |
| `M` | Toggle Mute |
| `→` | Seek forward 10s |
| `←` | Seek backward 10s |

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `server/models/Movie.js` | MongoDB movie schema |
| `server/models/User.js` | MongoDB user schema + bcrypt |
| `server/seed.js` | 20 public-domain movies seed |
| `server/routes/admin.js` | Admin CRUD API |
| `client/src/components/player/VideoPlayer.jsx` | Custom HLS/MP4 player |
| `client/src/pages/admin/index.js` | Admin dashboard |
| `client/src/pages/movie/[id].js` | Movie page + streaming |
| `client/src/context/AuthContext.jsx` | JWT auth state management |

---

## 🔧 Adding New Movies

**Via Admin Panel** (recommended):
1. Go to `http://localhost:3000/admin`
2. Login with admin credentials
3. Click "Add Movie"
4. Fill in title, description, genre, year, poster URL, and stream URL
5. Click "Add Movie" to save

**Via MongoDB directly:**
```js
db.movies.insertOne({
  title: "My Movie",
  streamUrl: "https://example.com/movie.mp4",
  // ... other fields
})
```

---

## 📝 Notes

- All seed movies are genuinely public-domain films (pre-1928 US copyright) hosted on Internet Archive
- Stream URLs point to Internet Archive's CDN — no copyrighted content is hosted
- The video player supports both MP4 and HLS (m3u8) formats
- For commercial streaming providers (Streamtape, Vidstream etc.), obtain embed URLs from those services and store them in `streamSources`
