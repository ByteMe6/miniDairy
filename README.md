# miniDairy

A minimal daily diary — write anything, entries disappear after 24 hours. Great for daily plans, reminders, or notes you don't need to keep.

[Русский](./README.ru.md)

## Features

- Google and email/password sign-in (Firebase Auth)
- Write and delete posts
- Posts sorted by newest first
- Auto-cleanup after 24 hours
- Toast notifications

## Tech

- Vanilla JavaScript
- Firebase Auth + Realtime Database
- Toastify
- nanoid

## Setup

No bundler required — open `index.html` directly or serve with any static file server.

Firebase config is already embedded. To use your own project, replace the config in `js/index.js`.
