# Snipio — Step-by-Step Build Guide

Build the app in this order. Each step is a small, working slice. Do not skip ahead — later steps depend on earlier ones.

**Core loop we are building:**

```text
Create room → Join on tablet → Connect extension → Alt+S → Slide appears on tablet → Drag into notes
```

Related docs: [Problem Statement](./ProblemStatement.md) · [Solution](./Solution.md) · [System Architecture](./System-Architecture.md)

---

## How to use this guide

- Finish one step fully before starting the next.
- Every step has a **Done when** checklist. If it is not true, the step is not done.
- Keep the product rules: no accounts, no cloud storage of images, rooms are temporary, tablet needs zero install.

**Status key:** `[done]` already built · `[next]` current work · `[todo]` later

---

## Step 1 — Home page (landing) `[done]`

**Goal:** A public landing page that explains Snipio and shows Create room / Join room as the only actions.

**What was built**

- Next.js app shell (`src/app/layout.tsx`, `src/app/globals.css`)
- Landing page (`src/app/page.tsx`)
- Navbar, hero, room card (Create / Join tabs), demo strip, before/after, how-it-works, features, CTA, footer
- Design tokens (warm off-white + orange accent), layout width, light motion

**Files**

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/Navbar.tsx`
- `src/components/RoomCard.tsx`
- `src/components/HowItWorks.tsx`
- `src/components/BeforeAfter.tsx`
- `src/components/Features.tsx`
- `src/components/Footer.tsx`
- `src/components/Reveal.tsx`
- `src/components/icons.tsx`

**Done when**

- [x] `npm run dev` shows the landing page
- [x] Create room / Join room UI exists (buttons do not have to work yet)
- [x] Page looks good on laptop and phone

**Do not do in this step:** real rooms, sockets, extension, or tablet feed.

---

## Step 2 — Room identity and routing `[next]`

**Goal:** Clicking Create / Join actually takes you to a room URL. No realtime yet — just pages and IDs.

**What to build**

1. Room ID format: short, readable, e.g. `DBMS-4821` (4 letters + 4 digits, or similar).
2. Helper: `src/lib/roomId.ts` — `generateRoomId()`, `isValidRoomId()`.
3. Dynamic route: `src/app/room/[roomId]/page.tsx`.
4. Wire landing buttons:
   - **Create room** → generate ID → `router.push(/room/{id}?role=host)`
   - **Join room** → validate code → `router.push(/room/{id}?role=tablet)`
5. Invalid codes show a simple error on the landing join input (do not navigate).
6. Placeholder room page: “Room DBMS-4821” + Host vs Tablet label from the query. Empty state is fine.

**Files to add**

- `src/lib/roomId.ts`
- `src/app/room/[roomId]/page.tsx`
- Update `src/components/RoomCard.tsx` (make it a client component that navigates)
- Update landing CTA `#create-room-btn` / `#cta-create-room-btn` the same way

**Done when**

- [ ] Create room opens `/room/XXXX-0000?role=host`
- [ ] Join with a valid code opens `/room/XXXX-0000?role=tablet`
- [ ] Bad join codes stay on the home page with an error
- [ ] Refreshing the room URL still shows the placeholder

**Do not do in this step:** sockets, QR, or sending images.

---

## Step 3 — Realtime room server

**Goal:** A tiny Socket.io (or similar) gateway that can create rooms, join rooms, and broadcast events. Images are not stored on disk.

**What to build**

1. Lightweight server, e.g. `server/socketServer.ts` (or a Next.js custom server / separate Node process).
2. In-memory rooms:

```text
Room {
  id
  createdAt
  expiresAt          // e.g. 3 hours
  hostSocketId?
  devices: { id, role: host | tablet | extension }[]
}
```

3. Events (names can stay like this):

| Event | Who sends | Meaning |
| :--- | :--- | :--- |
| `room:create` | laptop | Create or claim a room as host |
| `room:join` | tablet / extension | Join existing room |
| `room:presence` | server | Device count + roles |
| `room:error` | server | Unknown room, expired, full, etc. |
| `slide:captured` | host / extension | Binary/base64 image + timestamp |
| `slide:received` | server → tablet | Forward the slide |

4. No database. If the process restarts, rooms die. That is OK for MVP.
5. TTL: delete a room after ~3 hours of idle or after host disconnects (pick one rule and stick to it).

**Files to add**

- `server/socketServer.ts`
- `src/lib/realtime.ts` — client helper (`connect()`, `createRoom()`, `joinRoom()`)
- Env: `NEXT_PUBLIC_SOCKET_URL`

**Done when**

- [ ] Two browser tabs can join the same room ID
- [ ] Host sees “1 device” then “2 devices” when the second tab joins
- [ ] Unknown room ID returns a clear error
- [ ] Server logs show join / leave

**Do not do in this step:** QR, extension, or image transfer (you can send a test ping event if useful).

---

## Step 4 — Host dashboard (laptop room view)

**Goal:** After Create room, the laptop shows a real host screen: code, QR placeholder, live device list.

**What to build**

1. Detect `role=host` on `/room/[roomId]`.
2. `HostDashboard` component:
   - Large room code
   - “Waiting for tablet…” then “Tablet connected”
   - Device count from `room:presence`
   - Copy-code button
   - Empty drop zone stub (“Drop a screenshot here”) — no watcher yet
3. Connect the host socket on mount (`room:create` or `room:join` as host).
4. Disconnect on unmount / tab close.

**Files to add**

- `src/components/HostDashboard.tsx`
- Update `src/app/room/[roomId]/page.tsx`

**Done when**

- [ ] Creating a room lands on the host dashboard
- [ ] Opening the same room as tablet in another tab updates the host “devices connected”
- [ ] Closing the tablet tab drops the count back

**Do not do in this step:** generating a real QR image yet (a labeled box is enough).

---

## Step 5 — Tablet receiver page

**Goal:** Joining a room on a phone/tablet shows a feed UI ready to receive slides (still empty).

**What to build**

1. Detect `role=tablet` (or treat any non-host join as tablet).
2. `TabletFeed` component:
   - Header: room code, connection status, Auto-save toggle (UI only)
   - Empty state: “Waiting for slides. Press Alt+S on the laptop.”
   - List area for `SlideCard`s (empty for now)
3. Join via socket. If room missing/expired, show “Room not found — create one on the laptop.”
4. Layout must work in split-screen (narrow width, large tap targets).

**Files to add**

- `src/components/TabletFeed.tsx`
- `src/components/SlideCard.tsx` (static card first)
- `src/components/AutoSaveToggle.tsx` (local state only)

**Done when**

- [ ] Join from home opens the tablet feed
- [ ] Status goes from connecting → connected
- [ ] Empty state is readable on a ~600px-wide split view

**Do not do in this step:** actual images, download, or drag-and-drop.

---

## Step 6 — QR pairing

**Goal:** Tablet joins by scanning a QR instead of typing the code.

**What to build**

1. QR encodes the full join URL, e.g. `https://<host>/room/DBMS-4821?role=tablet`.
2. Render QR on the host dashboard (library such as `qrcode` is fine).
3. Locally, QR must use the laptop’s LAN URL (`http://192.168.x.x:3000/...`), not `localhost` — otherwise the tablet cannot open it.
4. Helper to pick the public origin for QR (`window.location.origin` in production; configurable in local dev).

**Done when**

- [ ] Phone camera scan opens the tablet feed in the browser
- [ ] Same room, host sees the tablet connect
- [ ] Typing the code still works as a fallback

---

## Step 7 — Manual drop on host (first real transfer)

**Goal:** Prove the pipe: drop/paste an image on the laptop → tablet feed shows it. No extension yet.

**What to build**

1. Host dropzone + paste (`Ctrl/Cmd+V`) accepts `image/png` / `image/jpeg`.
2. Convert file → ArrayBuffer or base64.
3. Emit `slide:captured` with `{ id, mime, bytes, createdAt }`.
4. Server broadcasts `slide:received` to everyone in the room except the sender (or to tablets only).
5. Tablet prepends a `SlideCard` with a blob URL.
6. Keep slides **in memory on each client**. Server must not write files to disk.

**Files**

- `src/lib/slides.ts` (types + blob helpers)
- Update `HostDashboard`, `TabletFeed`, `SlideCard`, `realtime.ts`

**Done when**

- [ ] Drop a PNG on the host tab
- [ ] Tablet tab shows that image in under ~200ms on the same Wi‑Fi
- [ ] Two drops appear in capture order
- [ ] Refreshing the tablet loses history (expected for MVP — no persistence)

This is the first “magic” moment. Get this solid before the extension.

---

## Step 8 — Chrome extension scaffold

**Goal:** A Manifest V3 extension that can be loaded unpacked and knows which room it belongs to.

**What to build**

```text
extension/
  manifest.json
  popup.html
  popup.ts
  background.ts
  content.ts
  icons/
```

1. `manifest.json`: `action`, `commands` (`Alt+S`), `host_permissions` for the Snipio origin, `activeTab`.
2. Popup: room code input, Join / Disconnect, status (idle / connected / error).
3. Save room ID in `chrome.storage.local`.
4. Background service worker: connect to the same Socket.io server as the web app, join as `role: extension`.
5. Host dashboard shows “Extension connected” when presence includes an extension.

**Done when**

- [ ] Load unpacked in `chrome://extensions`
- [ ] Popup can join the current room
- [ ] Host dashboard lists the extension as a device
- [ ] Alt+S is registered (it can `console.log` for now)

**Do not do in this step:** canvas capture yet.

---

## Step 9 — Alt+S video frame capture

**Goal:** In a YouTube (or any `<video>`) lecture, Alt+S grabs a clean frame — no browser chrome.

**What to build**

1. Content script finds the largest playing `<video>`.
2. Draw `video` → `<canvas>` at native resolution.
3. `canvas.toBlob('image/png')` (or jpeg at high quality).
4. Send blob to the background worker (`chrome.runtime.sendMessage`).
5. Background emits `slide:captured` on the existing socket.
6. Fallback if no video: `chrome.tabs.captureVisibleTab` (full tab — worse quality, but better than nothing).
7. Tiny toast on the page: “Sent to tablet” / “No video found”.

**Done when**

- [ ] YouTube lecture, Alt+S, tablet shows the exact current frame
- [ ] Image has no YouTube controls overlay when the video element is used
- [ ] Pressing Alt+S repeatedly sends multiple slides in order

---

## Step 10 — Tablet actions: copy, drag, auto-save

**Goal:** Once a slide is on the tablet, the student can get it into Samsung Notes without WhatsApp.

**What to build**

1. **One-tap copy:** `navigator.clipboard.write` with a `ClipboardItem` of the image blob.
2. **Drag and drop:** `SlideCard` is `draggable`; `dataTransfer` includes the image file / URL so Samsung Notes (or a notes PWA) can accept it in split-screen.
3. **Auto-save toggle:** when ON, each new slide triggers a programmatic `<a download>` so Android puts it in Downloads / Gallery.
4. Optional: light haptic/vibration + a short sound on receive.
5. Zoom / full-screen preview on tap (so they can read a diagram before copying).

**Files**

- `src/lib/autoSave.ts`
- `src/lib/clipboard.ts`
- Update `SlideCard.tsx`, `AutoSaveToggle.tsx`

**Done when**

- [ ] Tap copies image; paste works in a notes app
- [ ] Auto-save ON downloads each new slide without a prompt loop (browser may still ask once)
- [ ] Drag works at least to another browser tab / desktop folder; tablet Notes is the target to test on a real device

---

## Step 11 — Folder watcher (OS screenshots)

**Goal:** Cmd+Shift+4 / Win+Shift+S also flow into the room, for VLC / Zoom / anything outside the browser.

**What to build**

1. On the host dashboard, “Watch screenshot folder”.
2. Use the **File System Access API** (`showDirectoryPicker` + periodic `dir.entries()` or `FileSystemObserver` where available).
3. Detect new `png/jpg/webp` files (ignore already-seen names).
4. Read file → same `slide:captured` path as dropzone.
5. Explain in UI: “Choose Desktop or the folder your OS saves screenshots to.”
6. This only runs while the host tab is open — that is acceptable for MVP.

**Done when**

- [ ] User grants a folder once per session
- [ ] A new screenshot file in that folder appears on the tablet without drag-drop
- [ ] Duplicate events for the same file do not spam the feed

---

## Step 12 — Room lifecycle and empty / error states

**Goal:** Rooms feel temporary and the UI never looks “stuck”.

**What to build**

1. Expire rooms after TTL; show “This room ended. Create a new one.”
2. Host refresh: re-claim the same ID if it still exists, otherwise recreate.
3. Tablet refresh: re-join; if gone, error + link home.
4. Extension: if socket drops, auto-reconnect and show status in the popup.
5. Max devices (optional): e.g. 1 host + 2 tablets + 1 extension.
6. “Leave room” on host closes the room for everyone.

**Done when**

- [ ] Expired / unknown rooms are obvious
- [ ] Killing the server and restarting does not crash the UI (reconnect or “disconnected”)
- [ ] Host leave kicks the tablet with a message

---

## Step 13 — PWA for the tablet

**Goal:** “Add to Home Screen” so the receiver feels like an app in split-screen.

**What to build**

1. `manifest.webmanifest` (name, icons, `display: standalone`, theme color).
2. Icons from the existing bolt mark.
3. Service worker: **offline shell only**. Do not cache lecture images as a product feature.
4. Optional “Install” hint on the tablet feed the first time.

**Done when**

- [ ] Chrome / Samsung Internet can install Snipio
- [ ] Installed PWA still joins rooms and receives slides

---

## Step 14 — Polish the real product UI

**Goal:** Host and tablet screens should match the landing quality (tokens, type, motion) — not a default form.

**What to build**

1. Reuse `globals.css` tokens on room pages.
2. Host: QR prominent, status readable from across a desk.
3. Tablet: cards like the landing demo strip, newest first, timestamps.
4. Loading / receiving shimmer (you already have a “receiving…” pattern on the home page — reuse it).
5. Accessibility: focus states, tap targets ≥ 44px, don’t rely on color alone for “connected”.

**Done when**

- [ ] Room pages look like the same product as the home page
- [ ] Usable one-handed on a tablet in split view

---

## Step 15 — Deploy and local-network testing

**Goal:** Laptop and tablet on the same Wi‑Fi can use a deployed (or tunneled) URL.

**What to build**

1. Deploy Next.js app (Vercel or similar).
2. Deploy socket server where both clients can reach it (same origin proxy is best: `/socket.io` through Next, or a known `wss://` URL).
3. Extension `host_permissions` updated to production origin.
4. HTTPS required for clipboard, camera QR, and PWA in production.
5. Write a 5-minute test script in this file’s appendix (below).

**Done when**

- [ ] Phone scans production QR, joins, receives an Alt+S frame
- [ ] No `localhost` left in QR or extension config for the production build

---

## Later (not MVP)

Only after the loop above is reliable:

- Lecture-named rooms and session history
- Export all slides as PDF / ZIP
- OCR on a slide
- Native Android app for background receive while locked
- Accounts / sync across days

---

## Suggested build order (checklist)

| Step | Piece | Status |
| :---: | :--- | :---: |
| 1 | Home page | done |
| 2 | Room IDs + `/room/[roomId]` | next |
| 3 | Socket room server | todo |
| 4 | Host dashboard | todo |
| 5 | Tablet feed shell | todo |
| 6 | QR pairing | todo |
| 7 | Drop/paste image → tablet | todo |
| 8 | Extension scaffold | todo |
| 9 | Alt+S canvas capture | todo |
| 10 | Copy / drag / auto-save | todo |
| 11 | Folder watcher | todo |
| 12 | Expiry & reconnect | todo |
| 13 | PWA | todo |
| 14 | Room UI polish | todo |
| 15 | Deploy + real-device test | todo |

---

## Appendix — 5-minute end-to-end test

1. Laptop: open Snipio → Create room.
2. Tablet: scan QR (or type code) → feed says connected.
3. Chrome: load extension → join the same room code.
4. YouTube lecture → **Alt+S** → slide appears on tablet.
5. Tablet: copy → paste into Notes **or** drag card into Notes **or** auto-save and open Gallery.
6. Optional: watch screenshot folder → OS screenshot also appears on tablet.

If all six pass, the MVP is done.
