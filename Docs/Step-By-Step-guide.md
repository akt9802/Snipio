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
  content.ts / content.js (built — region snip overlay)
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

## Step 9 — Alt+S region screenshot `[done]`

**Goal:** Alt+S works like macOS **Cmd+Shift+4** / Windows **Win+Shift+S**: the user drags a rectangle, and **only that cropped region** is sent to the tablet. Do not grab the whole YouTube video frame, the whole tab, or any `<video>` canvas dump.

**What was built**

- `Alt+S` starts a snip. If the extension is not in a room, an in-page toast says “Join a room first”.
- Background captures the current tab (`chrome.tabs.captureVisibleTab`, PNG), then the content script shows that bitmap as a frozen overlay (crosshair, dim, “Drag to select · Esc to cancel”). Overlay mounts on `document.fullscreenElement` when YouTube is fullscreen.
- Drag to select a rectangle (accent border + `W × H` label). Mouse-up crops **only that region** (CSS px mapped to the capture bitmap, including retina scale). Selections under 8×8 CSS px are ignored.
- Cropped PNG is sent on the existing `slide:captured` socket path. The uncropped tab image is never emitted. No `<video>` canvas grab.
- Toasts: “Sent to tablet”, “Cancelled” (Esc), and short errors if capture/send fails.
- A second `Alt+S` hides the current overlay, recaptures, and starts a fresh snip. Service worker restores the socket on wake so Alt+S still works after idle.
- Manifest: `scripting` + `https://*/*` host permission so YouTube/Udemy can be captured; content script injected on demand if the tab was open before the extension loaded.

**Files**

- `extension/content.ts` — overlay, drag-select, crop, toast
- `extension/background.ts` — `captureVisibleTab`, receive crop, `slide:captured`
- `extension/manifest.json` — `scripting`, `https://*/*`, updated command description
- `extension/types.ts` — `SNIP_PING` / `SNIP_HIDE` / `SNIP_START` / `SNIP_CAPTURED` / `SNIP_TOAST`
- `extension/popup.html` — hint text
- `extension/build.mjs` — content script bundled as IIFE

**Done when**

- [x] YouTube (or any tab): Alt+S → crosshair overlay on a frozen screenshot
- [x] Drag a region around *just the slide* → tablet shows **only that crop**, not the whole player
- [x] Esc cancels; nothing appears on the tablet
- [x] Pressing Alt+S repeatedly sends multiple crops in order
- [x] Full-tab image is never sent; video-element capture is not used

**Do not do in this step:** tablet copy / drag / auto-save (Step 10), or OS folder watching (Step 11).

---

## Step 10 — Tablet actions: copy, drag, auto-save `[done]`

**Goal:** Once a slide is on the tablet, the student can get it into Samsung Notes without WhatsApp.

**What was built**

- **Copy:** each card has a 44px Copy button. Uses `navigator.clipboard.write` + `ClipboardItem` of the image blob. Feedback: “Copied — paste into Notes” (or a download fallback if the browser blocks clipboard images).
- **Drag:** the slide image is `draggable`. `dataTransfer` includes a `File`, `text/uri-list`, and Chrome `DownloadURL` so it can land in another tab, a desktop folder, or (on a real device) Notes in split-screen.
- **Auto-save:** header toggle, persisted in `localStorage`. When ON, each *new* slide triggers a programmatic `<a download>` (browser may still ask once). Does not re-download the same slide.
- **Preview:** tap the image for a full-screen view (Esc / tap outside / close). Copy and Save are available there so a diagram can be read before pasting.
- **Receive cue:** short vibration + a quiet tick when a slide arrives (both optional if the browser blocks them).

**Files**

- `src/lib/clipboard.ts`
- `src/lib/autoSave.ts`
- `src/components/room/SlideCard.tsx`
- `src/components/room/AutoSaveToggle.tsx`
- `src/components/room/TabletFeed.tsx`
- `src/components/layout/icons.tsx` (`CloseIcon`)

**Done when**

- [x] Tap Copy; paste works in a notes app (clipboard image support varies by browser)
- [x] Auto-save ON downloads each new slide without a prompt loop (browser may still ask once)
- [x] Drag works at least to another browser tab / desktop folder; tablet Notes is the target to test on a real device

**Do not do in this step:** OS screenshot folder watching (Step 11).

---

## Step 11 — Folder watcher (OS screenshots) `[done]`

**Goal:** Native OS snips still flow into the room when the lecture is **not** in Chrome — VLC, Zoom desktop, PowerPoint, a second monitor. Step 9 already covers in-browser region capture (Alt+S). This step is the same crop-from-disk idea for **Cmd+Shift+4** / **Win+Shift+S** files the OS writes to a folder.

**What was built**

- Host dashboard card: **Watch screenshot folder**. Copy explains Desktop / OS screenshot folder, and that Alt+S is for in-Chrome lectures.
- **File System Access API:** `showDirectoryPicker` (starts on Desktop). Existing files are snapshotted and ignored; only *new* `png` / `jpg` / `webp` files send. WebP is converted to PNG so it fits the existing slide pipe.
- Watch loop: poll ~1.4s + `FileSystemObserver` when Chrome provides it + a scan when the tab becomes visible again. Duplicate `name + lastModified + size` keys are skipped. Files still being written (size 0 / too fresh) wait for the next scan.
- New files go through the same `ingestFiles` / `slide:captured` path as dropzone, so they show on host **and** tablet.
- Runs only while the host tab is open. Chrome/Edge only; other browsers get a short “needs Chrome or Edge” note. Grant is per session (pick the folder again after refresh).

**Files**

- `src/lib/folderWatch.ts`
- `src/components/room/FolderWatch.tsx`
- `src/components/room/HostDashboard.tsx`
- `src/components/layout/icons.tsx` (`FolderIcon`)
- `src/types/file-system-access.d.ts`

**Done when**

- [x] User grants a folder once per session
- [x] A new OS screenshot file in that folder appears on the tablet without drag-drop
- [x] Duplicate events for the same file do not spam the feed
- [x] This path does not replace Alt+S region snip (Step 9) — both work

**Do not do in this step:** room expiry / leave / reconnect polish (Step 12).

---

## Step 12 — Room lifecycle and empty / error states `[done]`

**Goal:** Rooms feel temporary and the UI never looks “stuck”.

**What was built**

- **TTL expiry:** rooms still expire 3 hours after last activity. Everyone in the room gets `room:error` `expired` and sees **“This room ended. Create a new one.”** Host can create a fresh room; tablet gets a home link.
- **Host refresh:** `room:create` re-claims the same ID if it is still live (replaces a host in another tab). If the room is gone (TTL or server restart), the host recreates it.
- **Tablet refresh:** re-joins. Unknown / expired / closed rooms show a clear panel + Back home. A few silent re-joins cover the race where the host is also reconnecting after a server restart.
- **Reconnect:** web clients reconnect automatically. Killing the socket process shows **Disconnected / Reconnecting** (not a frozen empty feed). Host recreates the room on reconnect; tablet and extension re-join.
- **Extension:** socket drops go to `reconnecting` in the popup (room code kept). Auto-reconnect is unlimited. Terminal errors (expired / closed / full / unknown after retries) stop and show the message. Join is restored after a service-worker restart.
- **Max devices:** 1 host + 2 tablets + 1 extension. Extra tablets get `full`. A second extension replaces the previous one.
- **Leave room** on the host emits `room:leave`, deletes the in-memory room, and kicks every device with **“The host left. This room is closed.”** Back home still leaves the room open until TTL (closing the tab does not delete it).

**Files**

- `server/socketServer.ts` (`room:leave`, close/expire, device caps, host/extension reclaim)
- `src/lib/roomEvents.ts` (`closed`, max-device constants, ended helpers)
- `src/lib/realtime.ts` (`room:leave`, reconnect options)
- `src/lib/useRoomSession.ts` (ended status, reconnect, `leaveRoom`)
- `src/components/room/RoomStatePanel.tsx`
- `src/components/room/HostDashboard.tsx`
- `src/components/room/TabletFeed.tsx`
- `src/components/layout/icons.tsx` (`LeaveIcon`)
- `extension/background.ts`
- `extension/popup.ts`
- `extension/types.ts`

**Done when**

- [x] Expired / unknown rooms are obvious
- [x] Killing the server and restarting does not crash the UI (reconnect or “disconnected”)
- [x] Host leave kicks the tablet with a message

**Do not do in this step:** PWA / add-to-home-screen (Step 13).

---

## Step 13 — PWA for the tablet `[done]`

**Goal:** “Add to Home Screen” so the receiver feels like an app in split-screen.

**What was built**

- Web app manifest (`src/app/manifest.ts`): name Snipio, `display: standalone`, theme `#e8642a`, start URL `/`.
- Icons from the existing bolt mark: SVG favicon, Apple touch PNG (180), PWA PNGs at `/icons/192`, `/icons/512`, and a maskable 512.
- Service worker (`public/sw.js`): **offline shell only** — precaches `/offline`, network-first navigations, never caches images, `/_next`, `/api`, or Socket.io. Lecture slides stay in-memory blob URLs.
- Optional **Download as app** on the landing page (header, hero, and bottom CTA) plus an install hint on the tablet feed. Chrome / Samsung can prompt natively; otherwise the button explains Add to Home Screen. Hidden only when already running as an installed app.
- `theme-color`, `apple-web-app-capable`, and `viewport-fit=cover` so the installed app matches the warm off-white shell.

**Files**

- `src/app/manifest.ts`
- `src/app/icon.svg`
- `src/app/apple-icon.tsx`
- `src/app/icons/[size]/route.tsx`
- `src/lib/appIcon.tsx`
- `public/sw.js`
- `src/app/offline/page.tsx`
- `src/components/layout/ServiceWorkerRegister.tsx`
- `src/components/layout/InstallAppButton.tsx`
- `src/components/layout/Navbar.tsx`
- `src/app/page.tsx`
- `src/components/room/InstallHint.tsx`
- `src/lib/pwa.ts`
- `src/app/layout.tsx`
- `src/components/room/TabletFeed.tsx`
- `next.config.ts` (`/sw.js` headers)

**Done when**

- [x] Chrome / Samsung Internet can install Snipio
- [x] Installed PWA still joins rooms and receives slides

**Do not do in this step:** room UI polish (Step 14). On HTTP LAN IPs some browsers skip install / service workers — localhost and HTTPS are the install targets.

---

## Step 14 — Polish the real product UI `[done]`

**Goal:** Host and tablet screens should match the landing quality (tokens, type, motion) — not a default form.

**What was built**

- Room pages reuse landing tokens: `.room-card`, `.room-slide`, `.btn-secondary`, receiving shimmer, safe-area padding.
- **Host:** desk-sized status (word + color: Live / Wait / Alert), 28px room code, larger padded QR, 44px Copy / Leave / folder actions. Sending uses the same “receiving…” tile as the home demo strip.
- **Tablet:** cards match the landing demo strip (rounded tile, timestamp, newest first with a **New** badge and receive glow). Empty/connecting shows the receiving shimmer. Status pill includes a text label, not color alone. Header/footer respect notch safe-areas for split-view / PWA.
- Focus rings stay the global accent outline; tap targets are ≥ 44px on Copy, Auto-save, install, leave, and folder buttons.

**Files**

- `src/app/globals.css`
- `src/components/room/StatusBadge.tsx`
- `src/components/room/ReceivingTile.tsx`
- `src/components/room/HostDashboard.tsx`
- `src/components/room/JoinQr.tsx`
- `src/components/room/TabletFeed.tsx`
- `src/components/room/SlideCard.tsx`
- `src/components/room/FolderWatch.tsx`

**Done when**

- [x] Room pages look like the same product as the home page
- [x] Usable one-handed on a tablet in split view

**Do not do in this step:** production deploy (Step 15).

---

## Step 15 — Deploy and local-network testing `[next]`

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
| 9 | Alt+S region screenshot | done |
| 10 | Copy / drag / auto-save | done |
| 11 | Folder watcher | done |
| 12 | Expiry & reconnect | done |
| 13 | PWA | done |
| 14 | Room UI polish | done |
| 15 | Deploy + real-device test | next |

---

## Appendix — 5-minute end-to-end test

1. Laptop: open Snipio → Create room.
2. Tablet: scan QR (or type code) → feed says connected.
3. Chrome: load extension → join the same room code.
4. YouTube lecture → **Alt+S** → drag a rectangle around the slide only → **that crop** appears on the tablet (not the whole player).
5. Tablet: copy → paste into Notes **or** drag card into Notes **or** auto-save and open Gallery.
6. Optional: watch screenshot folder → an OS **Cmd+Shift+4 / Win+Shift+S** file also appears on the tablet.
7. Optional: host **Leave room** → tablet shows “The host left. This room is closed.”
8. Optional: tablet **Add to Home Screen** / Install → reopen the PWA, join the same room, receive a slide.

If the first six pass, the MVP loop works. Step 12 is the lifecycle around that loop. Step 13 is the tablet install shell. Step 14 is host/tablet visual polish.
