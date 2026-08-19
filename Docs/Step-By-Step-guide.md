# Snipio — Step-by-Step Build Guide

Build the app in this order. Each step is a small, working slice. Do not skip ahead — later steps depend on earlier ones.

**Core loop we are building:**

```text
Create room → Join on tablet → Connect extension → Alt+S → drag a region → that crop appears on tablet → Drag into notes
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
- `src/components/layout/Navbar.tsx`
- `src/components/landing/RoomCard.tsx`
- `src/components/landing/HowItWorks.tsx`
- `src/components/landing/BeforeAfter.tsx`
- `src/components/landing/Features.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/Reveal.tsx`
- `src/components/layout/icons.tsx`

**Done when**

- [x] `npm run dev` shows the landing page
- [x] Create room / Join room UI exists (buttons do not have to work yet)
- [x] Page looks good on laptop and phone

**Do not do in this step:** real rooms, sockets, extension, or tablet feed.

---

## Step 2 — Room identity and routing `[done]`

**Goal:** Clicking Create / Join actually takes you to a room URL. No realtime yet — just pages and IDs.

**What was built**

- Room ID format: `XXXX-0000` (4 letters + 4 digits)
- Helper: `src/lib/roomId.ts` — `generateRoomId()`, `isValidRoomId()`, `normalizeRoomId()`, `roomPath()`
- Dynamic route: `src/app/room/[roomId]/page.tsx` (placeholder with Host vs Tablet label)
- Create room / landing CTA navigate to `/room/{id}?role=host`
- Join room validates the code, then navigates to `/room/{id}?role=tablet`
- Invalid codes stay on the home page with an error under the join input

**Files**

- `src/lib/roomId.ts`
- `src/app/room/[roomId]/page.tsx`
- `src/components/landing/CreateRoomButton.tsx`
- `src/components/landing/RoomCard.tsx`
- `src/app/page.tsx`

**Done when**

- [x] Create room opens `/room/XXXX-0000?role=host`
- [x] Join with a valid code opens `/room/XXXX-0000?role=tablet`
- [x] Bad join codes stay on the home page with an error
- [x] Refreshing the room URL still shows the placeholder

**Do not do in this step:** sockets, QR, or sending images.

---

## Step 3 — Realtime room server `[done]`

**Goal:** A tiny Socket.io (or similar) gateway that can create rooms, join rooms, and broadcast events. Images are not stored on disk.

**What was built**

- Separate Socket.io process (`server/socketServer.ts`) on port 3001
- In-memory rooms (no database; gone on process restart)
- Events: `room:create`, `room:join`, `room:presence`, `room:error`, plus `slide:captured` / `slide:received` forwarding (no UI yet)
- TTL: rooms expire **3 hours after last activity**; host disconnect does not delete the room
- Client helper: `connect()`, `createRoom()`, `joinRoom()`
- Room page shows live device count (1 → 2 when a second tab joins) and unknown-room errors
- `npm run dev` starts web + socket together

**Files**

- `server/socketServer.ts`
- `src/lib/roomEvents.ts`
- `src/lib/realtime.ts`
- `src/components/room/RoomPresence.tsx`
- `src/app/room/[roomId]/page.tsx`
- `.env.example` (`NEXT_PUBLIC_SOCKET_URL`, `SOCKET_PORT`)

**Done when**

- [x] Two browser tabs can join the same room ID
- [x] Host sees “1 device” then “2 devices” when the second tab joins
- [x] Unknown room ID returns a clear error
- [x] Server logs show join / leave

**Do not do in this step:** QR, extension, or image transfer (you can send a test ping event if useful).

---

## Step 4 — Host dashboard (laptop room view) `[done]`

**Goal:** After Create room, the laptop shows a real host screen: code, QR placeholder, live device list.

**What was built**

- `role=host` on `/room/[roomId]` renders `HostDashboard`
- Large room code, copy-code button, live device list from `room:presence`
- Status: “Waiting for tablet…” then “Tablet connected”
- QR placeholder box (no generated QR yet)
- Empty drop-zone stub (“Drop a screenshot here”)
- Host socket connects on mount (`room:create`) and disconnects on unmount

**Files**

- `src/components/room/HostDashboard.tsx`
- `src/lib/useRoomSession.ts`
- `src/app/room/[roomId]/page.tsx`

**Done when**

- [x] Creating a room lands on the host dashboard
- [x] Opening the same room as tablet in another tab updates the host “devices connected”
- [x] Closing the tablet tab drops the count back

**Do not do in this step:** generating a real QR image yet (a labeled box is enough).

---

## Step 5 — Tablet receiver page `[done]`

**Goal:** Joining a room on a phone/tablet shows a feed UI ready to receive slides (still empty).

**What was built**

- Any non-host join (`role=tablet` or missing role) renders `TabletFeed`
- Compact header: room code, connecting → connected status, Auto-save toggle (UI only)
- Empty state: “Waiting for slides. Press Alt+S on the laptop.”
- `SlideCard` list wired but empty (no images yet)
- Unknown / expired rooms show “Room not found — create one on the laptop.”
- Narrow layout with large tap targets for split-screen

**Files**

- `src/components/room/TabletFeed.tsx`
- `src/components/room/SlideCard.tsx`
- `src/components/room/AutoSaveToggle.tsx`
- `src/app/room/[roomId]/page.tsx`

**Done when**

- [x] Join from home opens the tablet feed
- [x] Status goes from connecting → connected
- [x] Empty state is readable on a ~600px-wide split view

**Do not do in this step:** actual images, download, or drag-and-drop.

---

## Step 6 — QR pairing `[done]`

**Goal:** Tablet joins by scanning a QR instead of typing the code.

**What was built**

- QR encodes the full join URL (`/room/{id}?role=tablet`)
- Real QR on the host dashboard (`qrcode`)
- Local QR uses the laptop LAN IP (`http://192.168.x.x:3000`), not localhost
- Origin helper: `NEXT_PUBLIC_APP_ORIGIN` override, else `window.location.origin`, else `/api/lan-origin`
- Typing the room code on Join room still works

**Files**

- `src/lib/joinOrigin.ts`
- `src/app/api/lan-origin/route.ts`
- `src/components/room/JoinQr.tsx`
- `src/components/room/HostDashboard.tsx`
- `.env.example` (`NEXT_PUBLIC_APP_ORIGIN`)

**Done when**

- [x] Phone camera scan opens the tablet feed in the browser
- [x] Same room, host sees the tablet connect
- [x] Typing the code still works as a fallback

---

## Step 7 — Manual drop on host (first real transfer) `[done]`

**Goal:** Prove the pipe: drop/paste an image on the laptop → tablet feed shows it. No extension yet.

**What was built**

- Host dropzone accepts `image/png` / `image/jpeg` via drop, paste (`Ctrl/Cmd+V`), or file picker
- Client converts the file to base64 and emits `slide:captured` with `{ id, mime, bytes, createdAt }`
- Server validates mime/size in memory and broadcasts `slide:received` to the rest of the room (not the sender). No files written to disk
- Host dropzone shows sending / sent / error, plus a **Sent this session** thumbnail grid of every slide that went out
- Tablet prepends a `SlideCard` with a blob URL; slides stay **in memory on each client**
- Tablet empty state tells you to drop or paste on the laptop

**Files**

- `src/lib/slides.ts` (types + blob helpers)
- `src/lib/roomEvents.ts` (`isValidSlidePayload`)
- `src/lib/realtime.ts` (`sendSlide`)
- `src/lib/useRoomSession.ts` (`sendSlide` + `subscribeSlides`)
- `src/components/room/HostDashboard.tsx`
- `src/components/room/TabletFeed.tsx`
- `src/components/room/SlideCard.tsx`
- `server/socketServer.ts`

**Done when**

- [x] Drop a PNG on the host tab
- [x] Tablet tab shows that image in under ~200ms on the same Wi‑Fi
- [x] Two drops appear in capture order
- [x] Refreshing the tablet loses history (expected for MVP — no persistence)

**Do not do in this step:** extension capture, or tablet copy / drag / auto-save.

This is the first “magic” moment. Get this solid before the extension.

---

## Step 8 — Chrome extension scaffold `[done]`

**Goal:** A Manifest V3 extension that can be loaded unpacked and knows which room it belongs to.

**What was built**

- `manifest.json`: Manifest V3, `action` popup, `commands` with `Alt+S` keybinding, `host_permissions` for `localhost` and LAN IPs, `activeTab` and `storage` permissions.
- Popup (`popup.ts`): room code input with auto-formatting, Join / Disconnect toggle, live status indicator (idle / connecting / connected / error), advanced section to override the socket server URL. State persisted via `chrome.storage.local`.
- Background service worker (`background.ts`): connects to Socket.io server with `transports: ['websocket']`, joins as `role: extension`, handles `room:presence` / `room:error` / `disconnect`. Notifies popup on state changes. Listens for `Alt+S` via `chrome.commands` — logs for now; region snip in Step 9. Restores connection on browser startup.
- Host dashboard updated: shows `Extension connected` / `Ready · tablet + extension` when an extension device appears in presence.
- Build: `npm run extension:build` (one-shot) or `npm run extension:watch` (auto-rebuild). `esbuild` and `@types/chrome` added as dev dependencies.

**Extension folder**

```text
extension/
  manifest.json
  popup.html
  popup.ts / popup.js (built)
  background.ts / background.js (built — includes socket.io-client bundle)
  content.ts / content.js (built — placeholder for step 9 region snip)
  types.ts
  build.mjs
  icons/icon16.svg, icon48.svg, icon128.svg
```

**Files**

- `extension/manifest.json`
- `extension/popup.html`
- `extension/popup.ts`
- `extension/background.ts`
- `extension/content.ts`
- `extension/types.ts`
- `extension/build.mjs`
- `extension/icons/` (3 SVG icons)
- `package.json` (`extension:build` / `extension:watch` scripts; `esbuild` + `@types/chrome` deps)
- `src/components/room/HostDashboard.tsx`

**Done when**

- [x] Load unpacked in `chrome://extensions` (run `npm run extension:build` first, then load the `extension/` folder)
- [x] Popup can join the current room
- [x] Host dashboard lists the extension as a device and shows Extension connected
- [x] Alt+S is registered (logs to the service worker console)

**Do not do in this step:** region selection overlay yet.

---

## Step 9 — Alt+S region screenshot `[next]`

**Goal:** Alt+S works like macOS **Cmd+Shift+4** / Windows **Win+Shift+S**: the user drags a rectangle, and **only that cropped region** is sent to the tablet. Do not grab the whole YouTube video frame, the whole tab, or any `<video>` canvas dump.

**Why this instead of a video frame:** a lecture slide is usually one rectangle on screen (the slide, a diagram, a formula). Sending the full player — talking head, YouTube chrome, related videos — wastes the tablet and the notes app. A snip is what students already know.

**What to build**

1. **Hotkey:** `Alt+S` (already in the extension) starts a snip. If the extension is not connected to a room, toast “Join a room first” and stop.
2. **Freeze, then select (do not snip a live moving video):**
   - Background: `chrome.tabs.captureVisibleTab` → PNG of the current tab.
   - Content script: full-viewport overlay on top of the page. Show that captured bitmap as the backdrop (so the lecture is frozen). Dim everything; cursor = crosshair.
3. **Drag to select:** mousedown → drag → mouseup draws a rectangle. Show a thin marching-ants / accent border and optional `W × H` label. **Esc** or a second `Alt+S` cancels with no send.
4. **Crop only the selection:** map the rectangle from CSS pixels to the bitmap (account for `devicePixelRatio` / capture scale). Draw that sub-rect to a canvas → `toBlob('image/png')`. If the rect is tiny (e.g. under 8×8 CSS px), ignore it.
5. **Send the crop, not the full tab:** content script posts the blob (or base64) to the background worker → existing `slide:captured` socket path from Step 7. Never emit the uncropped `captureVisibleTab` image.
6. **Toast:** “Sent to tablet” on success, “Cancelled” on Esc, a short error if capture/permission fails.
7. **Repeat:** each Alt+S is a new snip. Overlay must tear down cleanly so the next press works (including YouTube fullscreen — inject into the fullscreen element if needed).

**Do not do in this step**

- Do not find a `<video>` and `drawImage(video)` — that is the old plan and it is wrong for this product.
- Do not send the full visible tab “as a fallback”.
- Do not use OS screenshot APIs / folder watching (that is Step 11, for apps *outside* Chrome).

**Files**

- `extension/content.ts` — overlay, drag-select, crop, toast
- `extension/background.ts` — `captureVisibleTab`, receive crop, `slide:captured`
- `extension/manifest.json` — permissions for tab capture if missing (`activeTab` + host access for the lecture origin)
- `extension/types.ts` — message types (`SNIP_START`, `SNIP_CAPTURED`, …)

**Done when**

- [ ] YouTube (or any tab): Alt+S → crosshair overlay on a frozen screenshot
- [ ] Drag a region around *just the slide* → tablet shows **only that crop**, not the whole player
- [ ] Esc cancels; nothing appears on the tablet
- [ ] Pressing Alt+S repeatedly sends multiple crops in order
- [ ] Full-tab image is never sent; video-element capture is not used

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

**Goal:** Native OS snips still flow into the room when the lecture is **not** in Chrome — VLC, Zoom desktop, PowerPoint, a second monitor. Step 9 already covers in-browser region capture (Alt+S). This step is the same crop-from-disk idea for **Cmd+Shift+4** / **Win+Shift+S** files the OS writes to a folder.

**What to build**

1. On the host dashboard, “Watch screenshot folder”.
2. Use the **File System Access API** (`showDirectoryPicker` + periodic `dir.entries()` or `FileSystemObserver` where available).
3. Detect new `png/jpg/webp` files (ignore already-seen names). OS region snips are already cropped — send the file as-is (same `slide:captured` path as the dropzone).
4. Explain in UI: “Choose Desktop or the folder your OS saves screenshots to. Use this for apps outside Chrome; use Alt+S in the lecture tab.”
5. This only runs while the host tab is open — that is acceptable for MVP.

**Done when**

- [ ] User grants a folder once per session
- [ ] A new OS screenshot file in that folder appears on the tablet without drag-drop
- [ ] Duplicate events for the same file do not spam the feed
- [ ] This path does not replace Alt+S region snip (Step 9) — both work

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

- [ ] Phone scans production QR, joins, receives an Alt+S region snip
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
| 2 | Room IDs + `/room/[roomId]` | done |
| 3 | Socket room server | done |
| 4 | Host dashboard | done |
| 5 | Tablet feed shell | done |
| 6 | QR pairing | done |
| 7 | Drop/paste image → tablet | done |
| 8 | Extension scaffold | done |
| 9 | Alt+S region screenshot | next |
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
4. YouTube lecture → **Alt+S** → drag a rectangle around the slide only → **that crop** appears on the tablet (not the whole player).
5. Tablet: copy → paste into Notes **or** drag card into Notes **or** auto-save and open Gallery.
6. Optional: watch screenshot folder → an OS **Cmd+Shift+4 / Win+Shift+S** file also appears on the tablet.

If all six pass, the MVP is done.
