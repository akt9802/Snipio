# Snipio — Interview Questions & Answers

Study this before a product, system-design, or full-stack interview about this project. Answers match **what the repo actually does today**, not every idea in the architecture sketches.

Related docs: [Problem Statement](./ProblemStatement.md) · [Solution](./Solution.md) · [System Architecture](./System-Architecture.md) · [Step-by-Step Guide](./Step-By-Step-guide.md)

**If an interviewer has read the README vs the code:** the README and architecture doc mention WebRTC, PeerJS, video-frame canvas grabs, and PDF/ZIP export. Those are **planned / sketched**. The running MVP uses Socket.io, in-memory rooms, region capture via `chrome.tabs.captureVisibleTab`, and no persistence of images. Say that out loud. It shows you know the difference between a design and a ship.

---

## How to use this file

- **30-second pitch** first. Most interviews start there.
- Product questions → System design → Implementation deep dives → Trade-offs → Failure modes.
- Prefer the short answer, then add one concrete detail from the code if they probe.
- Do not claim WebRTC P2P, accounts, cloud image storage, or lecture history unless you are talking about *future work*.

---

## 0. Elevator pitches

### 30 seconds

Snipio moves a lecture screenshot from a laptop to a tablet in one gesture. You create a temporary room, scan a QR on the tablet, press Alt+S, drag a region, and that crop appears on the tablet so you can drag or paste it into Notes. No accounts, no WhatsApp, no cloud storage of images.

### 60 seconds

Students watch lectures on a laptop and take notes on a tablet. The old loop is screenshot → WhatsApp-to-self → download → Notes. Snipio replaces that with an ephemeral room. The laptop is the host, the tablet is a zero-install web receiver, and a Chrome extension captures a region of the current tab. Images travel over Socket.io as base64, live only in memory, and expire with the room after three hours of idle. The tablet can copy, drag into split-screen Notes, or auto-download to Gallery.

### 90 seconds (add architecture)

There are four pieces: a Next.js App Router site, a separate Socket.io process, a Manifest V3 extension, and a PWA shell on the tablet. Rooms are `XXXX-0000` IDs in an in-memory Map. Roles are host, tablet (max 2), and extension (max 1). Capture has three paths that all emit the same `slide:captured` event: Alt+S region snip, host drop/paste, and File System Access folder watch for OS screenshots. The server validates mime and size, then broadcasts `slide:received` to everyone except the sender. Nothing is written to disk.

---

## 1. Product and problem

### Q1. What problem does Snipio solve?

Students take screenshots of slides, diagrams, and code on a laptop, then need those images in a tablet notes app (Samsung Notes, OneNote, GoodNotes). The default path is **screenshot → WhatsApp to yourself → open WhatsApp on tablet → download → import into Notes**. That is 5–7 steps per slide during a long lecture.

The actual job is: **take a screenshot on the laptop and have it on the tablet immediately**, with almost no extra UI.

### Q2. Who is the user?

A student who:

- watches lectures on a laptop (YouTube, Coursera, Udemy, LMS),
- writes notes on a tablet,
- often mixes ecosystems (MacBook + Android tablet, Windows + Android),
- does not want another Drive / chat / account just to move a PNG.

### Q3. What is Snipio *not*?

Not a general file-sharing product, not cloud storage, not social sharing, not Google Drive, not a chat app. Scope is **instant lecture screenshots, laptop → tablet**. That boundary keeps the MVP small and the privacy story honest.

### Q4. What is the “magic moment”?

The user did not open an upload dialog. They pressed Alt+S (or took an OS snip into a watched folder) and the crop was already on the tablet.

Core sentence: *“I took a screenshot on my laptop, and now it’s on my tablet.”*

### Q5. What are the product principles?

1. **Minimal interaction** — connect once, then stay out of the way.
2. **Fast** — the image should feel instant on the same Wi‑Fi.
3. **Invisible** — after pairing, the student watches the lecture, not the tool.
4. **No accounts** for the basic experience.
5. **Temporary rooms** — lecture-length, not a permanent library.

### Q6. Walk through the user flow.

```text
Create room on laptop
  → tablet scans QR (or types XXXX-0000)
  → Chrome extension joins the same room
  → watch lecture
  → Alt+S → drag a rectangle
  → crop appears on tablet feed
  → drag into Notes / copy-paste / auto-save to Gallery
```

Optional: watch Desktop (or the OS screenshot folder) so Cmd+Shift+4 / Win+Shift+S files also flow in.

### Q7. Why a web app on the tablet instead of a native app?

Zero install. Scan QR → Chrome or Samsung Internet. Split-screen with Notes still works via HTML5 drag-and-drop, clipboard, and programmatic download. A native app would help **background receive while the screen is locked**; that is a later power-user path, not MVP.

### Q8. Why three ways to get the image into Notes?

Different OSes and browsers block different APIs:

| Mode | When it wins |
| :--- | :--- |
| Split-screen drag | Samsung Notes / OneNote side-by-side |
| Clipboard copy | Paste into any notes app |
| Auto-save download | Lands in `/Download`, Gallery indexes it |

Clipboard image write is flaky on some browsers; download is the fallback.

### Q9. How is this different from AirDrop, Nearby Share, or WhatsApp?

Those are general transfer tools. They still need a pick-and-send step, a receive-and-save step, and they are often same-ecosystem. Snipio is **lecture-shaped**: room stays open for the whole class, capture is a hotkey, receiver is a live feed ordered by time, tablet needs no app install.

### Q10. What would you *not* build in v1, and why?

Lecture-named archives, PDF/ZIP export, OCR, accounts, search, native background sync. None of those help the first screenshot of the first lecture. If the pipe is unreliable, extra features hide the real bug.

---

## 2. High-level system design

### Q11. Draw the system.

```text
Laptop Chrome
  ├─ Next.js host dashboard  ──┐
  └─ Extension (Alt+S crop)  ──┼──► Socket.io gateway (port 3001)
Tablet browser / PWA         ──┘         │
                                         │ in-memory rooms
                                         ▼
                              broadcast slide:received
                                         │
                                         ▼
                              Tablet feed (blob URLs in RAM)
```

Four processes/clients:

1. **Next.js 16** web app (landing, host, tablet, PWA).
2. **Socket.io server** (`server/socketServer.ts`) — separate Node process.
3. **Manifest V3 extension** — capture + join as `role: extension`.
4. **Tablet PWA** — same Next app, standalone display.

### Q12. Why a separate Socket.io process instead of Next.js API routes?

HTTP request/response is a bad fit for presence, reconnect, and push. Socket.io gives rooms, broadcast, disconnect events, and a long-lived connection. The gateway is tiny and has a different lifecycle than the Next server (TTL sweep, in-memory Map). `npm run dev` runs both via `concurrently`.

Production still needs both reachable (same-origin `/socket.io` proxy or a known `wss://` URL). That is Step 15, not done yet.

### Q13. Why not WebRTC DataChannels for the images?

**Honest answer:** the architecture doc *proposes* WebRTC for LAN P2P. The **implemented** path is Socket.io with base64 in the payload (`maxHttpBufferSize: 8e6`).

Why Socket.io first:

- Simpler: no STUN/TURN, NAT, or signaling state machine.
- Works as soon as both clients can reach the gateway (same Wi‑Fi or a public host).
- One event schema for dropzone, folder watch, and extension.

Cost: the server sees every image, bandwidth is ~33% worse because of base64, and a far-away VPS adds latency. WebRTC is the right next step if you want laptop → tablet bytes that never sit on the broker.

If asked “would you use WebRTC?”: yes as an upgrade — Socket.io stays the **signaling + presence** layer; DataChannel carries the blob when peers can connect; Socket.io is the fallback.

### Q14. Why not store images in S3 / a database?

Product rule: **no cloud storage of lecture screenshots.** Rooms are ephemeral. The server validates and forwards; it does not write files. Clients keep blob URLs in memory. Refreshing the tablet **loses history**. That is expected for MVP and is a privacy feature, not a bug.

### Q15. What is the data path for one snip?

1. Extension: `captureVisibleTab` → content script overlay → user drags a rect → crop to PNG → base64.
2. Background worker emits `slide:captured` `{ id, mime, bytes, createdAt }`.
3. Server: socket must already be in a room; `isValidSlidePayload`; `touch(room)` (extends TTL); `socket.to(roomId).emit("slide:received", payload)` — **not** back to the sender.
4. Tablet: `slideFromPayload` → `Blob` + `URL.createObjectURL` → prepend `SlideCard`.
5. Optional: vibrate + tick; auto-save `<a download>`; copy via `ClipboardItem`.

Host drop/paste and folder watch call the same `sendSlide` helper, so the tablet cannot tell which capture path was used.

### Q16. Why broadcast to the room instead of addressing the tablet socket?

A room can have two tablets. Presence is “everyone in this lecture.” `socket.to(roomId)` is Socket.io’s room broadcast excluding the sender, so the host dropzone does not echo the image back as a received event (the host shows its own “Sent this session” grid from the local file).

---

## 3. Rooms, IDs, and presence

### Q17. What does a room ID look like and why?

Format: **4 letters + dash + 4 digits**, e.g. `KLPN-4821` (`XXXX-0000`). Pattern: `/^[A-Z]{4}-\d{4}$/`.

Why:

- Short enough to read aloud and type on a tablet.
- Dash is a natural pause (like a Wi‑Fi password chunk).
- Letters skip `I` and `O` in the generator alphabet (`ABCDEFGHJKLMNPQRSTUVWXYZ`) so they are not confused with `1` and `0`.
- `normalizeRoomId` uppercases, strips spaces/underscores, and inserts the dash if the user typed `dbms4821`.

The landing copy uses examples like `DBMS-4821`; generated IDs are random, not lecture names. Named rooms are future work.

### Q18. Who creates the room — client or server?

The **client generates** the ID (`generateRoomId` + `crypto.getRandomValues`), then the host emits `room:create` with that ID. The server inserts it into a `Map` if it is new, or **reclaims** it if it is still live.

Why client-side generate: the URL is `/room/{id}?role=host` before the socket connects. The page can render immediately. Collision chance for 22^4 × 10^4 ≈ 2.3e9 IDs is negligible at lecture scale. The server still validates the pattern.

### Q19. Host vs tablet vs extension — how are roles assigned?

| Role | How you get it | Socket event |
| :--- | :--- | :--- |
| **host** | `/room/{id}?role=host` | `room:create` |
| **tablet** | QR or join form (`role=tablet` or missing role) | `room:join` |
| **extension** | popup “Join” | `room:join` with `role: "extension"` |

The room **page** is a server component: `role === "host"` → `HostDashboard`, otherwise `TabletFeed`. Authority for who may send `room:leave` is the **socket role**, not the URL. Only a socket that created/claimed as host can close the room.

### Q20. Device limits?

- 1 host (a second host tab **replaces** the previous host: “reclaimed in another tab”).
- Max **2 tablets**. A third gets `room:error` `full`.
- Max **1 extension**. A second extension **kicks** the first (“Another extension joined”).

Why: a leaked QR should not become a public slide dump. Two tablets cover “phone + tablet” or a friend looking on. One extension avoids two Alt+S pipelines fighting.

### Q21. Does closing the host tab delete the room?

**No.** Host disconnect only removes that socket from `devices` and broadcasts presence. The Map entry stays until:

- **TTL**: 3 hours after last create / join / slide (`touch` on activity), swept every 60s, or
- **Leave room**: host emits `room:leave` → everyone gets `closed` (“The host left…”).

Refresh: host `room:create` on the same ID reclaims it. Tablet refresh re-joins; a few silent retries cover the race where the host is also reconnecting after a server restart.

### Q22. Why 3-hour TTL?

A lecture plus overflow, without forcing the student to babysit a “keep alive.” Idle rooms do not leak forever in the process. Process restart **wipes all rooms** (in-memory only) — say this in interviews; it is an intentional ops trade-off.

---

## 4. Realtime implementation

### Q23. List the Socket.io events.

**Client → server**

| Event | Who | Purpose |
| :--- | :--- | :--- |
| `room:create` | host | create or reclaim |
| `room:join` | tablet / extension | enter existing room |
| `room:leave` | host | destroy room for everyone |
| `slide:captured` | host or extension | send image |

**Server → client**

| Event | Purpose |
| :--- | :--- |
| `room:presence` | device list + count |
| `room:error` | `unknown_room` / `expired` / `closed` / `full` / `invalid_id` |
| `slide:received` | image payload to others in the room |

### Q24. How do you validate a slide on the server?

`isValidSlidePayload`:

- `id` string length 8–80,
- `mime` only `image/png` or `image/jpeg`,
- `bytes` non-empty base64 string, length capped from **5 MB** original (`MAX_SLIDE_BYTES`) with ~4/3 expansion + padding,
- `createdAt` finite number.

Socket.io `maxHttpBufferSize` is **8 MB** so a 5 MB image plus JSON envelope still fits. Invalid payloads are dropped (logged), not stored.

WebP from the folder watcher is converted to PNG **on the client** before emit, because the server does not accept `image/webp`.

### Q25. Why base64 instead of binary?

Socket.io can send binary, but the first pipe used a JSON-shaped payload shared by web and the bundled extension. Base64 is simple to debug and to type. Downsides: size, CPU (`FileReader` / `atob`), and the 8 MB envelope. A later version should send `ArrayBuffer` / binary attachments.

### Q26. How does the web client choose the socket URL?

`getSocketUrl()`:

1. If `NEXT_PUBLIC_SOCKET_URL` is set and **not** a loopback host, use it.
2. Else use `window.location.hostname` with port **3001** and the same http/https as the page.

**Never** point a tablet that opened `http://192.168.x.x:3000` at `localhost:3001` — that would be the tablet itself. This is a real bug we designed around.

The extension defaults to `http://localhost:3001` (it runs on the laptop) and the popup can override the URL.

### Q27. Reconnect behavior?

Web: `reconnection: true`, infinite attempts, delay 800ms → max 5s. UI shows **Disconnected / Reconnecting**, not a frozen empty feed. Host recreates/reclaims on reconnect; tablet re-joins.

Tablet `unknown_room`: up to **3** delayed re-joins (host might still be coming back after a socket-process restart).

Extension: same infinite reconnect; `unknown_room` after it **had** presence is treated as reconnect (retry join in 1s). Terminal errors (`expired`, `closed`, `full`, `invalid_id`) stop and clear the saved join. Join is restored after service-worker sleep via `chrome.storage.local`.

### Q28. CORS and binding?

Socket server: `cors: { origin: true }`, listen `0.0.0.0:3001` so phones on LAN can connect. `/health` returns `{ ok, rooms }` for a cheap liveness check.

---

## 5. QR pairing and LAN

### Q29. What is encoded in the QR?

The **full tablet join URL**, not just the code: `/room/{id}?role=tablet` on a usable origin.

If the laptop is on `localhost`, a QR of `http://localhost:3000/...` is useless on the phone. `resolveJoinOrigin()`:

1. `NEXT_PUBLIC_APP_ORIGIN` if set,
2. else if the page host is not loopback, use `window.location.origin`,
3. else `GET /api/lan-origin` which picks a private IPv4 (`192.168.*` preferred, then `10.*`, then `172.16–31.*`) and rebuilds `http://{lanIp}:{port}`.

Typing the code on the home Join tab still works.

### Q30. Why an API route for LAN origin instead of only env?

Dev machines change Wi‑Fi IPs. Env is the override for tunnels/production. The OS `networkInterfaces()` helper is the zero-config local path.

---

## 6. Chrome extension and Alt+S

### Q31. Why an extension at all? Why not only the website?

A website **cannot** screenshot YouTube when the student is in another tab or in fullscreen. Extensions can:

- register a **global-in-Chrome** command (`Alt+S` via `chrome.commands`),
- `chrome.tabs.captureVisibleTab`,
- inject a content script overlay,
- keep a Socket.io connection in the **service worker**.

The host page still handles drop/paste and folder watch for non-Chrome lectures.

### Q32. Manifest V3 vs V2?

V3 is required for new Chrome extensions. Background is a **service worker** (can sleep). That is why we persist `joinedRoom` in `chrome.storage.local` and restore the socket on startup / worker wake. Alt+S still works after idle because `restoreConnection` runs before capture.

### Q33. Why region crop instead of grabbing the `<video>` canvas?

Architecture notes mention canvas frame grab (pure 1080p, no player chrome). The **shipped** behavior is **Cmd+Shift+4-style region select**:

- Full tab PNG is captured once (frozen overlay).
- User drags a rectangle; CSS pixels map onto the bitmap including **devicePixelRatio**.
- Selections under **8×8 CSS px** are ignored.
- **Only the crop** is emitted. The full-tab image never goes on the wire.
- Overlay parent is `document.fullscreenElement` when YouTube is fullscreen.

Reasons vs video canvas:

- Works on any tab (slides in a PDF viewer, LMS, code, not only `<video>`).
- Student chooses the exact diagram, not the whole player including recommendations.
- No DRM/`crossOrigin` canvas taint issues from some video CDNs.

Trade-off: you capture **what is on screen** (player chrome if they include it), not a raw decoded frame. If they ask “why not both?” — region snip is default; a “grab video frame” button could be an advanced option later.

### Q34. Walk through Alt+S in the extension.

1. `chrome.commands.onCommand` → `handleCapture`.
2. If not connected: in-page toast “Join a room first”.
3. Skip `chrome:`, `chrome-extension:`, `edge:`, `about:`, `devtools:` URLs.
4. Ensure content script (`scripting.executeScript` if the tab was open before install).
5. Hide any existing overlay, wait ~48ms, bump a generation counter (rapid Alt+S cancels the previous capture).
6. `captureVisibleTab(..., { format: "png" })`.
7. `SNIP_START` + data URL → content script: closed **shadow DOM** overlay, crosshair, dim, drag, Esc cancel.
8. Crop canvas → PNG → base64 → `SNIP_CAPTURED` message to background → `slide:captured`.

Closed shadow DOM reduces page CSS breaking the overlay (`all: initial` on the host).

### Q35. Permissions — what and why?

| Permission | Why |
| :--- | :--- |
| `storage` | persist room + socket URL across worker restarts |
| `activeTab` | act on the current lecture tab |
| `scripting` | inject content script on demand |
| `host_permissions` `http(s)://*/*` | capture YouTube/Udemy/LMS, not only `activeTab` one-shot |

Interviewers may ask about privacy: the extension can capture any http(s) tab the user is looking at. Mitigations: capture is **user-gesture** (Alt+S), crop is user-selected, images go only to a room the user typed, no analytics in MVP.

### Q36. Why websocket-only in the extension (`transports: ['websocket']`)?

Service workers and long polling are a worse mix; one transport keeps the connection model simple. The web app still allows `websocket` + `polling` for stricter networks.

---

## 7. Other capture paths

### Q37. Host dropzone — why build this before the extension?

Step 7 was the **pipe proof**: drop/paste/file picker → same `slide:captured` → tablet card. If that is slow or broken, the extension cannot save you. It is also the fallback when the student already has a PNG.

Paste uses `clipboardData.items` file kind with png/jpeg.

### Q38. Folder watcher — when do you need it?

Alt+S only sees **the Chrome tab**. Zoom desktop, VLC, PowerPoint, a second monitor, Cmd+Shift+4 to Desktop — those files appear on disk. Folder watch uses the **File System Access API** (`showDirectoryPicker`).

Details that sound senior in an interview:

- Snapshot existing files; only **new** png/jpg/webp send.
- Dedupe key: `name + lastModified + size`.
- Skip size 0 or lastModified &lt; 450ms (file still being written).
- Poll ~1.4s + `FileSystemObserver` when Chrome has it + scan on `visibilitychange`.
- WebP → PNG on client.
- Permission is **per session** (pick again after refresh). Chrome/Edge only.
- Stops when the host tab is closed.

This is not a native FS watcher; it is a browser-permissioned poll/observe loop. Good enough for lecture cadence, not for thousands of files per second.

---

## 8. Tablet receiver and Notes

### Q39. How are slides held in the UI?

Each client maps payload → `Slide`: `Blob` + `objectUrl` from `URL.createObjectURL`. Newest first. `revokeObjectURL` on cleanup. **No IndexedDB, no Cache Storage for images.**

PWA service worker explicitly **does not cache images**, `/_next`, `/api`, or Socket.io. Offline page is a shell only.

### Q40. Auto-save — how does a web page save to Gallery?

Programmatic `<a download>` with an object URL. On Android Chrome / Samsung Internet, that typically lands in Downloads; MediaStore indexes it into Gallery. The browser may **prompt once**. Toggle is in `localStorage`. Only **new** slides download (no re-download loop).

This is not a silent MediaStore insert (that needs a native app).

### Q41. Clipboard copy?

`navigator.clipboard.write([new ClipboardItem({ [type]: blob })])`. Fallback: `ClipboardItem` with a Promise (Safari-shaped). If blocked: tell the user to Download. Requires a **user gesture** (the Copy tap) and usually **HTTPS** (or localhost).

### Q42. Drag and drop into Notes?

The card image is `draggable`. `dataTransfer` includes a `File`, `text/uri-list`, and Chrome `DownloadURL` so it can land in another tab, a desktop folder, or Notes in split-screen. Real Samsung Notes behavior must be tested **on device**; desktop Chrome is only a proxy.

### Q43. Receive cue?

Short `navigator.vibrate` pattern + a tiny Web Audio oscillator tick. Both are best-effort (autoplay / permission).

---

## 9. PWA

### Q44. What did you ship for “install as an app”?

- Web app manifest: name Snipio, `display: standalone`, theme `#e8642a`, start URL `/`.
- Icons 192 / 512 / maskable 512, Apple touch 180.
- Service worker: precache `/offline`, network-first navigations, **never cache lecture images**.
- `beforeinstallprompt` button on landing + hint on tablet feed; hidden when already `display-mode: standalone`.
- `theme-color`, apple-web-app-capable, `viewport-fit=cover` for notch / split view.

HTTP LAN IPs often **cannot** install PWAs; localhost and HTTPS are the real install targets.

### Q45. Why not cache slides for offline review?

Product + privacy: slides are session-scoped. Caching them would accidentally become “cloud/history on device” and blow the “nothing stored” story. Offline = branding shell, not a lecture archive.

---

## 10. Frontend / Next.js

### Q46. Why Next.js App Router?

One codebase for landing, host, tablet, metadata, manifest, and small API (`/api/lan-origin`, dynamic PNG icons). Server Components for the room page shell; sockets and capture stay in **client** components (`"use client"`) because they need `window` and WebSocket.

Next 16 + React 19 as in `package.json`. Styling: Tailwind v4 + design tokens in `globals.css` (warm off-white, orange accent). Room UI reuses landing tokens (Step 14).

### Q47. How is host vs tablet decided in the URL?

Query `?role=host` vs anything else. Invalid room IDs still render a dashboard/feed with `valid={false}` so the user sees a clear error instead of a Next 404. Normalization happens in the server page so `/room/dbms-4821` and `/room/DBMS-4821` match.

### Q48. Why `useRoomSession` instead of calling Socket.io in every component?

One hook owns connect, create/join, presence, errors, reconnect, `sendSlide`, `subscribeSlides`, and `leaveRoom`. Host dashboard and tablet feed stay UI. Slide subscribers are a small pub/sub so the feed can unmount without tearing down the socket.

---

## 11. Privacy, security, abuse

### Q49. Security model in one paragraph?

Rooms are **unguessable-enough IDs**, not auth. Anyone with the code can join until the room is full or closed. There is no user account. The server does not persist images. Caps: 2 tablets, 1 extension, 5 MB, png/jpeg only. A leaked QR during a lecture is the main risk — TTL and “Leave room” bound it. This is **pairing secrecy**, not end-to-end encryption.

### Q50. Are images end-to-end encrypted?

No. The Socket.io process can see base64 payloads. For a student tool on a self-hosted or LAN server that is acceptable to state. If a recruiter pushes: add WebRTC so the broker never holds pixels, or encrypt the payload with a key in the QR fragment (`#key=`) that never hits the server logs.

### Q51. XSS / overlay attacks from the content script?

The snip UI is in a **closed shadow root** with `all: initial` so the lecture page cannot easily restyle or clickjack the overlay. We do not `eval` page JS for capture. `captureVisibleTab` is a screenshot of pixels, not DOM serialization.

### Q52. Rate limiting?

Not implemented beyond size/mime/device caps and TTL. Honest follow-up: per-socket slide rate limit, max slides per room, and disconnect on abuse would be needed on a public deploy.

### Q53. Why allow CORS `origin: true`?

Local LAN + unknown tablet origins during MVP. Production should allowlist the web origin.

---

## 12. Trade-offs (star format)

Use **Situation → Task → Approach → Result → why not the alternative**.

### Q54. In-memory Map vs Redis vs Postgres?

**Chose Map.** Lecture rooms are hot, tiny, and disposable. Redis would survive process restart and scale to multiple socket nodes, but adds ops and still should not store images. Postgres is the wrong durability for “forget in 3 hours.”

Restart wiping rooms is the downside; reconnect + host reclaim papers over a **dev** restart, not a multi-instance production fleet. Horizontal scale ⇒ sticky rooms or Redis adapter for Socket.io.

### Q55. Next + separate socket vs one Node server?

Separate processes: Next can deploy on Vercel; sockets need a sticky Node host. Cost: two URLs, CORS, QR LAN origin bugs. Benefit: clear boundary and `tsx watch` on the gateway without restarting Next.

### Q56. PWA vs Play Store app?

PWA wins install friction. Native wins lock-screen receive and Gallery insert without a download prompt. 99% of the lecture is “tablet on the desk in split view” — PWA is enough.

### Q57. Base64 JSON vs binary vs object storage URLs?

Base64: simplest shared schema. Binary sockets: smaller, still through the server. Presigned S3 URLs: persist bytes, which we refuse. WebRTC: best privacy/latency on LAN, more code.

### Q58. Client-generated room IDs vs server-generated?

Client: URL and QR exist before connect. Server: can enforce uniqueness and unguessability with a crypto ID. We validate strictly and use a large space. For a public internet product, a server-issued ID plus a short **display code** is cleaner.

---

## 13. Failure modes (they will ask “what if”)

| What if | What happens |
| :--- | :--- |
| Tablet joins before host | `unknown_room`; tablet retries a few times; else “create on the laptop” |
| Room expired | `expired` — “This room ended. Create a new one.” |
| Host clicks Leave | all devices `closed` |
| Host only closes the tab | room stays until TTL; tablet still connected |
| Socket process killed | UI reconnecting; host recreates; tablet retries unknown_room |
| Third tablet | `full` |
| Second extension | first extension kicked |
| Alt+S on `chrome://extensions` | toast: can’t snip this page |
| Selection tiny | ignored (&lt; 8px) |
| Image &gt; 5 MB | client error; server drop |
| WebP screenshot | converted to PNG in folder watch |
| Refresh tablet | **history gone** (in-memory) |
| YouTube fullscreen | overlay mounts on fullscreen element |
| Extension worker slept | restore from `chrome.storage`, then Alt+S |
| QR is localhost | `/api/lan-origin` rewrites to 192.168.x.x |
| Clipboard blocked | Copy message tells user to Download |
| HTTP (not HTTPS) in prod | clipboard, camera, PWA, secure contexts break — deploy HTTPS |

### Q59. Why can two host tabs not coexist?

`reclaimRole` for host: last `room:create` wins. Avoids two laptops thinking they own the lecture. The kicked tab gets “reclaimed in another tab.”

---

## 14. Scale and production

### Q60. What is missing for production? (Step 15)

- Deploy Next (e.g. Vercel) **and** a Socket.io host both clients can reach.
- Prefer same-origin proxy `/socket.io` so tablets do not hit `:3001` on the laptop.
- Extension `host_permissions` + default socket URL for production.
- HTTPS everywhere.
- CORS allowlist, rate limits, maybe Socket.io Redis adapter.
- Real-device test: QR → Alt+S crop → Notes.

### Q61. How many concurrent lectures can this hold?

One Node process, one Map, ~5 MB spikes per slide, images not stored. Bottleneck is **bandwidth and CPU** on the broker (base64 decode is on clients; server mostly copies strings). Hundreds of small rooms is plausible; thousands of simultaneous 5 MB snips is not. Horizontal scale needs either:

- sticky load balancing + room affinity, or
- Redis adapter + still no disk images, or
- WebRTC so the server is signaling-only.

### Q62. How would you add lecture history without becoming Drive?

Optional **local** ZIP download at the end of the room (client-side jszip from in-memory blobs). Or encrypt-at-rest in IndexedDB with a key the user wrote down. Do not upload to your servers if the philosophy is ephemeral.

---

## 15. Code-level questions (expect a screen share)

### Q63. Why `socket.to(roomId).emit` not `io.to(roomId).emit` for slides?

`socket.to` = everyone in the room **except this socket**. `io.to` would include the sender. Host would receive its own drop as `slide:received` unless the client filtered by id.

### Q64. Why `touch(room)` on slides?

TTL is **idle** timeout, not wall-clock from create. A 4-hour lecture with snips every few minutes should not die at T+3h from create.

### Q65. Why skip I and O in room letters?

Ambiguous with 1 and 0 when someone reads the code aloud across a desk.

### Q66. What does `maxHttpBufferSize: 8e6` protect / enable?

Socket.io drops oversized packets. 5 MB raw × 4/3 base64 ≈ 6.7 MB + JSON keys must fit under 8 MB. It is both a DoS cap and a product cap aligned with `MAX_SLIDE_BYTES`.

### Q67. Why generation counter on capture?

Two fast Alt+S presses: the first `captureVisibleTab` might resolve after the second overlay started. Stale captures are ignored if `generation !== snipGeneration`.

### Q68. File System Access — why snapshot then ignore existing files?

Otherwise opening “Desktop” would dump every old screenshot into the lecture feed. Students only want **new** snips from this session.

### Q69. Why convert WebP?

macOS / Chrome sometimes writes WebP. Server allowlist is png/jpeg only. Convert once on the host so the rest of the pipeline stays two mimes.

### Q70. Service worker `bypass` list?

Do not intercept Socket.io (would break realtime), API, `/_next` assets, or images (privacy + freshness). Only navigations fall back to `/offline`.

---

## 16. Behavioral / “tell me about this project”

### Q71. Why this project? (motivation)

I live the problem: lectures on a laptop, notes on a tablet, WhatsApp as a cable. I wanted a **personal tool** with a tight MVP, then documented it as a product (problem → solution → architecture → incremental steps). Good interview signal: I can cut scope.

### Q72. Hardest technical bug?

**Localhost QR / socket URL on LAN.** Phone opens the laptop’s `localhost` or the tablet connects to its **own** port 3001. Fix: LAN origin API + `getSocketUrl()` uses the page hostname, ignoring loopback env when on a phone.

Second: **MV3 service worker sleep** dropping the socket; persist join and restore before Alt+S.

Third: **fullscreen YouTube** overlay attaching to `document.body` instead of `fullscreenElement`.

### Q73. How did you sequence the build?

Fifteen steps in `Step-By-Step-guide.md`. Rule: prove the pipe (drop image → other tab) **before** the extension. Extension scaffold before region crop. Tablet actions after images exist. Lifecycle/PWA/polish last. Deploy still `[next]`.

This is how you talk about incremental delivery.

### Q74. What would you do in the next two weeks?

1. Production deploy + HTTPS + proxied sockets.
2. Binary payloads or WebRTC fallback on LAN.
3. Per-room rate limits.
4. On-device test matrix: Samsung Notes split-screen, iPad Safari clipboard, Edge folder picker.
5. Optional: video-frame grab as an advanced command, still keeping region snip as default.

### Q75. Metrics if this were a startup?

Time from Alt+S mouse-up to first paint on tablet. % of sessions that get a second snip (retention of the magic). Join success rate (QR vs typed). Clipboard success vs download fallback. Not “DAU of a Drive clone.”

---

## 17. Rapid fire

| Question | Answer |
| :--- | :--- |
| Port of the web app? | Next default 3000 |
| Port of sockets? | 3001 (`SOCKET_PORT`) |
| Room TTL? | 3 hours after last activity |
| Sweep interval? | 60 seconds |
| Max image? | 5 MB |
| Allowed mimes? | png, jpeg (webp converted client-side) |
| Max tablets? | 2 |
| Max extensions? | 1 |
| Hotkey? | Alt+S |
| Min crop? | 8×8 CSS pixels |
| Persistence of slides? | none (memory / blob URLs) |
| Accounts? | none |
| Native tablet app? | no (PWA) |
| WebRTC in repo today? | no |
| DB? | no |
| Extension manifest? | V3 |
| Room ID regex? | `^[A-Z]{4}-\d{4}$` |
| Leave vs disconnect? | Leave destroys; disconnect does not |
| Health check? | `GET :3001/health` |

---

## 18. Questions *you* should ask the interviewer

If they are grilling this as a system-design round:

- Should the broker be allowed to see pixels, or must transfer be P2P?
- Is “refresh loses history” acceptable for a university deploy?
- One region (LAN club) or public internet?
- Do we need iOS Safari as a first-class host (no Alt+S extension)?

Those show you can change the architecture when constraints change.

---

## 19. Suggested 5-minute live demo script

1. Laptop: Create room — show code + QR + “Waiting for tablet”.
2. Phone/tablet: scan or join — presence goes to 2 devices.
3. Load unpacked extension, join the same code — “Extension connected”.
4. YouTube: Alt+S, crop **only the slide** — tablet shows the crop, not the whole player.
5. Tablet: Copy or Auto-save.
6. Optional: watch Desktop, OS screenshot appears.
7. Host Leave — tablet “The host left.”

If demo Wi‑Fi blocks device-to-device, use two Chrome windows on the laptop (host + tablet role) plus the extension.

---

## 20. One-page cheat sheet

**Problem:** screenshot → WhatsApp → Notes is too slow for lectures.

**Solution:** ephemeral room; Alt+S crop (or drop / folder watch) → Socket.io → tablet feed → Notes.

**Stack:** Next.js 16, React 19, Tailwind 4, Socket.io 4, MV3 extension (esbuild), PWA, File System Access, `qrcode`.

**Rules:** no accounts, no disk on server, 3h TTL, 5 MB, png/jpeg, 1 host + 2 tablets + 1 extension.

**Do not claim:** WebRTC, PeerJS, jspdf, canvas video grab, lecture cloud history — unless you label them as future / docs-only.

**Best line:** *The server is a short-lived switchboard. The product is the moment the crop is already on the tablet.*
