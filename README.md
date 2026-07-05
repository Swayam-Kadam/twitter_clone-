# ChatFlow

A full-stack social messaging application built with **Vue 3** and **Supabase**. ChatFlow combines a Twitter-style social feed with real-time chat — including direct messages, group chats, reactions, and media sharing — in a modern WhatsApp-inspired UI.

![ChatFlow](src/assets/chatflow-logo.svg)

---

## Live Demo

> Deploy the app and add your link here — recruiters prefer a live demo over local setup.

🔗 **[Add your live demo URL](https://social-clone-alpha.vercel.app/)**

---

## Author

**Swayam Kadam**

- GitHub: [@Swayam-Kadam](https://github.com/Swayam-Kadam)
- Repository: [twitter_clone-](https://github.com/Swayam-Kadam/twitter_clone-.git)
- LinkedIn: [Add your LinkedIn profile](https://linkedin.com/in/swayamkadam)

---

## Key Highlights

What makes this project stand out for technical interviews and portfolio reviews:

- **Real-time messaging** — 1:1 and group chats powered by Supabase Realtime (presence, typing indicators, read receipts)
- **Full auth flow** — Email/password + Google OAuth with automatic profile creation from Google metadata
- **Social features** — Posts, likes, comments, follow system, and user search
- **Production-ready UI** — WhatsApp-inspired design, light/dark theme, responsive layout
- **Media handling** — Image uploads for posts, chat messages, avatars, and group photos via Supabase Storage

---

## Features

### Authentication
- Email & password sign up / sign in
- Google OAuth login
- Password reset via email
- Auto-created user profiles (name, username, avatar from Google account)

### Social Feed
- Create posts with text and optional images
- Like and comment on posts
- Real-time feed updates via Supabase Realtime
- User search from the navbar

### Profiles
- Edit profile (avatar, bio, location, website)
- Follow / unfollow users
- View followers and following lists
- Posts, replies, and liked posts tabs

### Real-Time Chat
- One-to-one messaging with people you follow
- Group chats with custom name, avatar, and members
- Online / offline presence indicators
- Typing indicators
- Read receipts (delivered / read)
- Image sharing in messages
- Emoji picker and message reactions
- Delete messages

### UI / UX
- WhatsApp-style chat wallpaper and green brand theme
- Light and dark mode (saved in localStorage)
- Responsive layout (mobile & desktop)
- Toast notifications

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) |
| **Build Tool** | [Vite 7](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Routing** | [Vue Router 4](https://router.vuejs.org/) |
| **Backend / BaaS** | [Supabase](https://supabase.com/) |
| **Auth** | Supabase Auth (Email + Google OAuth) |
| **Database** | Supabase PostgreSQL |
| **Realtime** | Supabase Realtime (presence, broadcasts, postgres changes) |
| **Storage** | Supabase Storage (avatars, post images, chat images, group avatars) |
| **Validation** | [Yup](https://github.com/jquense/yup) |
| **Icons** | [Iconify](https://iconify.design/) + [unplugin-icons](https://github.com/unplugin/unplugin-icons) |
| **Utilities** | [VueUse](https://vueuse.org/), [date-fns](https://date-fns.org/) |
| **Notifications** | [vue-toast-notification](https://github.com/ankurk91/vue-toast-notification) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## Project Structure

```
src/
├── assets/              # Logo, icons, static images
│   ├── chatflow-icon.svg
│   └── chatflow-logo.svg
├── components/
│   ├── Auth/            # Login, signup, Google auth
│   ├── Chats/           # Chat page, groups, modals
│   ├── Navbar/          # Navigation + router config
│   ├── Posts/           # Social feed
│   ├── Profile/         # Profile page, posts, modals
│   └── lib/             # Supabase client, profile helpers
├── composables/         # Shared composables (theme)
├── App.vue
├── main.js
└── style.css            # Global styles, theme, wallpaper
public/
├── chatflow-icon.svg    # Favicon
├── chat-wallpaper.svg   # Chat background pattern
└── chat-wallpaper-dark.svg
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Supabase](https://supabase.com/) project

### 1. Clone the repository

```bash
git clone https://github.com/Swayam-Kadam/twitter_clone-.git
cd twitter_clone-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANONKEY=your_supabase_anon_key
```

You can find these values in **Supabase Dashboard → Project Settings → API**.

### 4. Supabase setup

#### Authentication
1. Enable **Email** provider under Authentication → Providers
2. Enable **Google** provider and add your OAuth credentials
3. Add your app URL to **Authentication → URL Configuration → Redirect URLs**  
   Example: `http://localhost:5173`

#### Storage buckets
Create the following buckets in Supabase Storage:

| Bucket | Purpose |
|--------|---------|
| `avatars` | User profile pictures |
| `post-images` | Post attachments |
| `chat-images` | Chat message images |
| `group-avatars` | Group profile pictures |

#### Database tables
The app expects tables such as:

- `profiles` — user profiles (id, username, full_name, bio, avatar_url, …)
- `posts` — social posts
- `likes` — post likes
- `replies` — post comments
- `follows` — follower relationships
- `chats` — 1:1 chat sessions
- `messages` — chat messages
- `groups` — group chat metadata
- `group_members` — group membership
- `group_messages` — group chat messages
- `message_reactions` — emoji reactions on messages

Enable **Row Level Security (RLS)** and appropriate policies for production use.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (with network access via `--host`) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

---

## Routes

| Path | Page | Auth |
|------|------|------|
| `/` | Social feed | Required |
| `/chat` | Messages & group chats | Required |
| `/profile` | Your profile | Required |
| `/profile/:user_id` | Other user's profile | Required |
| `/auth` | Login / signup / reset password | Guest only |

---

## Deployment

The project includes a `vercel.json` for SPA routing. Deploy to Vercel:

1. Push your repo to GitHub
2. Import the project in [Vercel](https://vercel.com/)
3. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANONKEY`)
4. Add your production URL to Supabase redirect URLs

```bash
npm run build
```

---

## Screenshots

| Feed | Chat | Profile |
|------|------|---------|
| _Add screenshot_ | _Add screenshot_ | _Add screenshot_ |

> **Tip for recruiters:** Take 3 screenshots (Feed, Chat, Profile) and replace the placeholders above. This significantly improves first impressions.

---

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Acknowledgments

- [Vue.js](https://vuejs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

---

<p align="center">
  Built with Vue 3 + Supabase
  <br />
  <strong>ChatFlow</strong> — Connect. Chat. Share.
</p>
