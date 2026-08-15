# ⚡ Snipio (SnipGo)

> **"Take a screenshot on your laptop — and it's instantly on your tablet."**  
> *Zero friction. Zero WhatsApp. Zero manual uploads.*

---

## 🎯 The Problem

When studying or watching video lectures (YouTube, Coursera, Udemy, college portals) on a laptop:
1. You take a screenshot of an important slide, code snippet, or diagram.
2. You want that screenshot immediately in your note-taking app on your tablet (Samsung Notes, GoodNotes, OneNote, Notability).
3. **The Current Painful Workflow**:
   ```
   Take Screenshot ➜ Open WhatsApp Web ➜ Send to "Me" ➜ Pick up Tablet ➜ Open WhatsApp ➜ Download Image ➜ Import to Notes
   ```
   *5 to 7 manual steps for every single slide during a 2-hour lecture.*

---

## 💡 The Snipio Solution

Snipio turns that multi-step friction into a seamless, automatic background flow:

```
[ Laptop: Take Screenshot / Alt+S ]  ───( Sub-100ms Sync )───►  [ Tablet: Instantly in Feed / Drag into Notes ]
```

- 🚀 **Zero Friction**: Captures pristine 1080p/4K video frames directly from YouTube via the browser extension (`Alt + S`) or OS screenshot shortcut (`Cmd + Shift + 4`).
- ⚡ **Instant Transfer**: Real-time WebRTC P2P / WebSocket transfer in under 100ms.
- 📱 **Zero Install on Tablet**: Works directly in **Chrome or Samsung Internet** on your tablet (or installed as a 1-tap PWA).
- ✍️ **Samsung Notes Ready**: Optimized for split-screen with **direct drag-and-drop**, **one-tap clipboard copy**, and **auto-save to gallery**.
- 🔒 **Ephemeral & Private**: Temporary rooms with QR code joining — no sign-up or accounts required.

---

## 📱 How Does the Tablet Receive & Auto-Download Screenshots?

### ❓ Is a native tablet app required?
**No! A zero-install Web App / PWA (Progressive Web App) is all you need.**
You simply scan the QR code displayed on your laptop using your tablet camera. It immediately opens the Snipio room (`snipio.app/room/DBMS-4821`) in Chrome or Samsung Internet.

### 📥 3 Tablet Receiving Modes:

1. **🖐️ Split-Screen Drag & Drop (Recommended)**:
   - Run Snipio on one half of your tablet screen and **Samsung Notes** on the other half.
   - When a slide arrives, touch and drag the card with your finger or S-Pen straight into your notes!
2. **📋 One-Tap Clipboard Copy**:
   - Tap the slide card. The raw image bitmap is copied directly to the Android clipboard.
   - Tap "Paste" in Samsung Notes.
3. **📥 Auto-Download to Gallery**:
   - Enable the "Auto-Save" toggle on the tablet page.
   - As soon as a screenshot arrives, the web app triggers an automated background download (`<a download>`), saving the file into `/Download` where it is instantly indexed into the **Samsung Gallery**.

---

## 🏗️ High-Level System Architecture

```mermaid
flowchart TB
    %% Styling
    classDef laptop fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef ext fill:#0f172a,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef server fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#f8fafc;
    classDef tablet fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;
    classDef notes fill:#701a75,stroke:#f472b6,stroke-width:2px,color:#f8fafc;

    subgraph Laptop ["💻 LAPTOP SOURCE (MacBook / PC)"]
        direction TB
        subgraph ExtTrack ["🎯 Track A: Browser Extension (YouTube / Web Lectures)"]
            E1["🎬 YouTube / Udemy Lecture"] -->|"Hotkey (Alt + S)"| E2["📸 Content Script: Canvas Frame Grab"]
            E2 -->|"Pristine 1080p/4K"| E3["⚡ Background Service Worker"]
        end

        subgraph WebTrack ["📁 Track B: Web Folder Watcher (VLC / Desktop App)"]
            W1["⌨️ OS Shortcut (Cmd+Shift+4)"] -->|"Saves to Folder"| W2["📂 File System Access API"]
            W2 -->|"Auto-Detect"| W3["🌐 Snipio Web Client"]
        end
    end
    class Laptop,ExtTrack,WebTrack laptop;
    class E2,E3 ext;

    subgraph Cloud ["⚡ REAL-TIME SYNC & ROOM BROKER"]
        direction TB
        S1["🚪 Ephemeral Room Gateway (Socket.io)"]
        S2["🔄 WebRTC P2P DataChannel (Direct LAN)"]
        S3["⏱️ Auto-Expiry TTL Cache (3hr Lifecycle)"]
        S1 <--> S2
        S1 --- S3
    end
    class Cloud,S1,S2,S3 server;

    subgraph Tablet ["📱 TABLET RECEIVER (Samsung Tablet / iPad)"]
        direction TB
        T1["🌐 Snipio Tablet Web / PWA (Split-Screen)"]
        T2["🖼️ Live Chronological Slide Feed"]
        T3["📥 Auto-Download Trigger (Saves to Gallery)"]
        T4["📋 One-Tap Clipboard Copy API"]
        T5["✋ Native Drag & Drop Handler"]
        
        T1 --> T2
        T2 --> T3
        T2 --> T4
        T2 --> T5
    end
    class Tablet,T1,T2,T3,T4,T5 tablet;

    subgraph NotesApp ["📝 NOTE-TAKING APP"]
        N1["📓 Samsung Notes / OneNote / GoodNotes"]
    end
    class NotesApp,N1 notes;

    %% Inter-connections
    E3 -->|"Sub-80ms WebSocket / WebRTC"| S1
    W3 -->|"Sub-150ms WebSocket / WebRTC"| S1
    S1 -->|"Instant Push Stream"| T1
    S2 -.->|"Direct P2P Binary Stream"| T1

    T3 -->|"Indexed by MediaStore"| N1
    T4 -->|"Paste from Clipboard"| N1
    T5 -->|"Direct Touch Drag"| N1
```

---

## 🔄 Complete End-to-End Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Student as 🧑‍🎓 Student
    participant Lap as 💻 Laptop (Snipio Web)
    participant Ext as 🧩 Browser Extension
    participant Server as ⚡ Realtime Room Relay
    participant Tab as 📱 Samsung Tablet (Web/PWA)
    participant Notes as 📝 Samsung Notes (Split-Screen)

    Note over Student, Lap: 🎬 SESSION INITIALIZATION
    Student->>Lap: 1. Opens snipio.app & Clicks "Create Room"
    Lap->>Server: Request Room Creation
    Server-->>Lap: Returns Room: "DBMS-4821" + Pair Token
    Lap->>Lap: Displays Pairing QR Code & Room Code

    Student->>Tab: 2. Scans QR Code with Tablet Camera
    Tab->>Server: Joins Room "DBMS-4821"
    Server-->>Lap: Handshake: "Tablet Connected 🟢"
    Server-->>Tab: Handshake: "Connected to Laptop 🟢"

    Student->>Ext: 3. Clicks Extension & Enters "DBMS-4821"
    Ext->>Server: Authenticate Extension for Room "DBMS-4821"
    Server-->>Ext: Connection Confirmed 🟢

    Note over Student, Ext: 📖 LECTURE IN PROGRESS (e.g. YouTube full-screen)
    Student->>Ext: 4. Student spots important slide & presses Alt + S
    activate Ext
    Ext->>Ext: Extracts current <video> frame via HTML5 Canvas (1080p)
    Ext->>Server: Emits "slide:captured" { imageBlob, timestamp, title }
    deactivate Ext

    activate Server
    Server->>Tab: Broadcasts "slide:received" (<100ms latency)
    deactivate Server

    activate Tab
    Tab->>Tab: Prepends new slide card to top of Live Feed
    Tab-->>Student: Plays subtle haptic/audio confirmation 🔔

    alt Auto-Save Mode is ON
        Tab->>Tab: Triggers programmatic download to /Download folder
        Note over Tab: Image automatically appears in Samsung Gallery
    end
    deactivate Tab

    Note over Student, Notes: ✍️ NOTE TAKING (Zero Friction)
    alt Option A: Split-Screen Drag & Drop
        Student->>Tab: Touches & Drags slide card with S-Pen
        Tab->>Notes: Drops image straight onto current lecture note page!
    else Option B: One-Tap Clipboard Copy
        Student->>Tab: Taps "Copy Slide" button
        Tab->>Tab: Copies image bitmap to Android Clipboard
        Student->>Notes: Taps "Paste" in Samsung Notes
    end
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript) | High-performance, responsive web application |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) + [Framer Motion](https://www.framer.com/motion/) | Slick, dark-mode first, animated UI designed for dual-screen productivity |
| **Browser Extension** | Chrome / Edge Manifest V3 (`popup`, `content_scripts`, `background`) | One-hotkey (`Alt + S`) pristine video canvas capture |
| **Realtime Sync** | WebSockets (Socket.io) + WebRTC DataChannels (PeerJS) | Sub-100ms P2P direct transfers across local Wi-Fi with cloud fallback |
| **Auto-Capture Engine** | Video Canvas Extractor + Web File System Access API | Zero-interaction screenshot detection on web video & Desktop folder |
| **Tablet Experience** | HTML5 Drag & Drop, Async Clipboard API, Auto-Save | Seamless integration with Samsung Notes & Gallery |
| **Export Engine** | `jspdf` / `jszip` | One-click export of the lecture's captured slides into a study PDF / ZIP |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or 20.x+
- npm / pnpm / yarn

### Installation & Local Run

```bash
# 1. Clone the repository
git clone https://github.com/akt9802/SnipGo.git
cd Snipio

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your laptop, create a room, and scan the QR code with your tablet!

---

## 📄 Documentation

- 📘 [Problem Statement](file:///Users/amankumar/Personal-Work/Coding/Snipio/Docs/ProblemStatement.md)
- 📗 [Solution Overview](file:///Users/amankumar/Personal-Work/Coding/Snipio/Docs/Solution.md)
- 📙 [Deep System Architecture & Extension Analysis](file:///Users/amankumar/Personal-Work/Coding/Snipio/Docs/System-Architecture.md)

---

## 📄 License

MIT License. Free to use for students, learners, and creators worldwide.
