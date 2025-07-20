# 🎴 Stuff Happens – Memory Card Game

A web-based memory and strategy game where players try to survive the wrath of bad luck cards! Featuring both a guest demo mode and full game with progress tracking.

### 👤 Author
**Farid Zandi**  
[faridmmz.github.io](https://faridmmz.github.io) | [GitHub](https://github.com/faridmmz) | [LinkedIn](https://linkedin.com/in/faridreza-momtazandi)

---

## 🚀 Features

- 🧠 **Demo Mode**: Quick one-round game with randomized cards.
- 🕹️ **Full Game**: Multi-round memory game for registered users.
- 📜 **Game History**: View past matches and card outcomes.
- 🔐 **Authentication**: User login and session management.

---

## 🗂️ Tech Stack

- **Frontend**: React (Vite), Context API
- **Backend**: Node.js, Express.js
- **Database**: SQLite with Sequelize ORM
- **Authentication**: Sessions with Passport.js

---

## 🧩 Core Routes and Components

### Frontend Routes:
- `/` – Landing page (play demo or log in)
- `/demo` – Demo game
- `/game` – Full game (authenticated)
- `/history` – Game history (authenticated)

### Key Components:
- `Home`, `DemoGame`, `FullGame`, `GameHistory`, `LoginForm`, `AuthContext`

---

## 🔧 Backend API Overview

- `POST /api/login` – Log in
- `GET /api/logout` – Log out
- `GET /api/session` – Check session
- `GET /api/cards/demo` – Demo cards
- `POST /api/cards/check-guess` – Check guess
- `POST /api/games` – Start game
- `POST /api/games/:id/next` – Next guess card
- `POST /api/games/:id/rounds` – Save round
- `GET /api/games/:id/summary` – End summary
- `GET /api/history` – Game history

---

## 🖼️ Screenshots

### 🎮 Game in Progress
![Gameplay Screenshot](Screenshot_GameInProgress.png)

### 📜 Game History
![History Screenshot](Screenshot_History.png)

---

## 🧪 Testing Credentials

- Username: `faridmmz` | Password: `1234`


---

## 📦 Installation

```bash
git clone https://github.com/faridmmz/stuff-happens-game
cd stuff-happens-game
npm install
npm run dev
