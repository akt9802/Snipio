import { createServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { isValidRoomId, normalizeRoomId } from "../src/lib/roomId";
import {
  isValidSlidePayload,
  MAX_EXTENSIONS_PER_ROOM,
  MAX_TABLETS_PER_ROOM,
  ROOM_CLOSED_MESSAGE,
  ROOM_ENDED_MESSAGE,
  type DeviceRole,
  type PresencePayload,
  type RoomCreatePayload,
  type RoomErrorPayload,
  type RoomJoinPayload,
  type SlidePayload,
} from "../src/lib/roomEvents";

/**
 * Rooms expire 3 hours after last activity (create / join / slide).
 * Host disconnect does not delete the room — the host can reclaim it.
 * Process restart wipes all rooms (in-memory only).
 */
const ROOM_TTL_MS = 3 * 60 * 60 * 1000;
const SWEEP_MS = 60_000;
const PORT = Number(process.env.SOCKET_PORT ?? 3001);

type Device = {
  id: string;
  role: DeviceRole;
};

type Room = {
  id: string;
  createdAt: number;
  expiresAt: number;
  hostSocketId?: string;
  devices: Device[];
};

type SocketData = {
  roomId?: string;
  role?: DeviceRole;
};

type ClientToServerEvents = {
  "room:create": (payload: RoomCreatePayload) => void;
  "room:join": (payload: RoomJoinPayload) => void;
  "room:leave": () => void;
  "slide:captured": (payload: SlidePayload) => void;
};

type ServerToClientEvents = {
  "room:presence": (payload: PresencePayload) => void;
  "room:error": (payload: RoomErrorPayload) => void;
  "slide:received": (payload: SlidePayload) => void;
};

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

const rooms = new Map<string, Room>();

function log(message: string) {
  const time = new Date().toISOString().slice(11, 19);
  console.log(`[socket ${time}] ${message}`);
}

function now() {
  return Date.now();
}

function touch(room: Room) {
  room.expiresAt = now() + ROOM_TTL_MS;
}

function presenceOf(room: Room): PresencePayload {
  return {
    roomId: room.id,
    deviceCount: room.devices.length,
    devices: room.devices.map((device) => ({ id: device.id, role: device.role })),
  };
}

function parseRoomId(raw: string | undefined): string | null {
  if (!raw) return null;
  const id = normalizeRoomId(raw);
  return isValidRoomId(id) ? id : null;
}

const httpServer = createServer();

const io: IoServer = new Server(httpServer, {
  cors: { origin: true, methods: ["GET", "POST"] },
  maxHttpBufferSize: 8e6,
});

httpServer.on("request", (req, res) => {
  const path = req.url ? new URL(req.url, "http://localhost").pathname : "";
  if (path !== "/health" || res.headersSent) return;
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
});

function emitError(socket: IoSocket, payload: RoomErrorPayload) {
  socket.emit("room:error", payload);
}

function broadcastPresence(room: Room) {
  io.to(room.id).emit("room:presence", presenceOf(room));
}

function countRole(room: Room, role: DeviceRole) {
  return room.devices.filter((device) => device.role === role).length;
}

function detachSocket(socket: IoSocket) {
  const roomId = socket.data.roomId;
  socket.data.roomId = undefined;
  socket.data.role = undefined;
  if (roomId) void socket.leave(roomId);
}

function kickDevice(room: Room, socketId: string, error: RoomErrorPayload) {
  const member = io.sockets.sockets.get(socketId);
  room.devices = room.devices.filter((device) => device.id !== socketId);
  if (room.hostSocketId === socketId) {
    room.hostSocketId = room.devices.find((device) => device.role === "host")?.id;
  }
  if (!member) return;
  member.emit("room:error", error);
  detachSocket(member);
}

function closeRoom(room: Room, error: RoomErrorPayload, reason: string) {
  for (const device of [...room.devices]) {
    const member = io.sockets.sockets.get(device.id);
    if (!member) continue;
    member.emit("room:error", error);
    detachSocket(member);
  }
  rooms.delete(room.id);
  log(`${reason} ${room.id}`);
}

function expireRoom(room: Room) {
  closeRoom(
    room,
    { code: "expired", message: ROOM_ENDED_MESSAGE },
    "expired",
  );
}

function reclaimRole(room: Room, role: DeviceRole, incomingId: string) {
  const occupants = room.devices.filter((device) => device.role === role && device.id !== incomingId);
  for (const occupant of occupants) {
    kickDevice(room, occupant.id, {
      code: "closed",
      message:
        role === "host"
          ? "This room was reclaimed in another tab."
          : "Another extension joined this room.",
    });
  }
}

function getLiveRoom(roomId: string): Room | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  if (room.expiresAt <= now()) {
    expireRoom(room);
    return undefined;
  }
  return room;
}

function addDevice(room: Room, socket: IoSocket, role: DeviceRole) {
  room.devices = room.devices.filter((device) => device.id !== socket.id);
  room.devices.push({ id: socket.id, role });
  if (role === "host") {
    room.hostSocketId = socket.id;
  }
  socket.data.roomId = room.id;
  socket.data.role = role;
  void socket.join(room.id);
  touch(room);
}

function leaveCurrentRoom(socket: IoSocket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  const room = rooms.get(roomId);
  socket.data.roomId = undefined;
  socket.data.role = undefined;
  void socket.leave(roomId);

  if (!room) return;

  room.devices = room.devices.filter((device) => device.id !== socket.id);
  if (room.hostSocketId === socket.id) {
    room.hostSocketId = room.devices.find((device) => device.role === "host")?.id;
  }

  log(`leave ${roomId} socket=${socket.id} remaining=${room.devices.length}`);
  broadcastPresence(room);
}

io.on("connection", (socket) => {
  log(`connect ${socket.id}`);

  socket.on("room:create", (payload) => {
    const roomId = parseRoomId(payload?.roomId);
    if (!roomId) {
      emitError(socket, {
        code: "invalid_id",
        message: "Use a room code like DBMS-4821.",
      });
      return;
    }

    leaveCurrentRoom(socket);

    let room = getLiveRoom(roomId);
    if (!room) {
      const createdAt = now();
      room = {
        id: roomId,
        createdAt,
        expiresAt: createdAt + ROOM_TTL_MS,
        devices: [],
      };
      rooms.set(roomId, room);
      log(`created ${roomId} host=${socket.id}`);
    } else {
      reclaimRole(room, "host", socket.id);
      log(`claimed ${roomId} host=${socket.id}`);
    }

    addDevice(room, socket, "host");
    broadcastPresence(room);
    log(`presence ${roomId} devices=${room.devices.length}`);
  });

  socket.on("room:join", (payload) => {
    const roomId = parseRoomId(payload?.roomId);
    if (!roomId) {
      emitError(socket, {
        code: "invalid_id",
        message: "Use a room code like DBMS-4821.",
      });
      return;
    }

    const room = getLiveRoom(roomId);
    if (!room) {
      log(`error unknown_room ${roomId} socket=${socket.id}`);
      emitError(socket, {
        code: "unknown_room",
        message: "Room not found — create one on the laptop first.",
      });
      return;
    }

    leaveCurrentRoom(socket);

    const role: DeviceRole = payload?.role === "extension" ? "extension" : "tablet";

    if (role === "tablet" && countRole(room, "tablet") >= MAX_TABLETS_PER_ROOM) {
      log(`error full ${roomId} role=tablet socket=${socket.id}`);
      emitError(socket, {
        code: "full",
        message: "This room is full — at most 2 tablets can join.",
      });
      return;
    }

    if (role === "extension" && countRole(room, "extension") >= MAX_EXTENSIONS_PER_ROOM) {
      reclaimRole(room, "extension", socket.id);
    }

    addDevice(room, socket, role);
    broadcastPresence(room);
    log(`join ${roomId} role=${role} socket=${socket.id} devices=${room.devices.length}`);
  });

  socket.on("room:leave", () => {
    const roomId = socket.data.roomId;
    if (!roomId || socket.data.role !== "host") return;

    const room = rooms.get(roomId);
    if (!room) {
      detachSocket(socket);
      return;
    }

    closeRoom(room, { code: "closed", message: ROOM_CLOSED_MESSAGE }, "closed");
  });

  socket.on("slide:captured", (payload) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = getLiveRoom(roomId);
    if (!room) return;
    if (!isValidSlidePayload(payload)) {
      log(`slide rejected ${roomId} from=${socket.id}`);
      return;
    }
    touch(room);
    socket.to(roomId).emit("slide:received", payload);
    log(`slide ${roomId} id=${payload.id} mime=${payload.mime} from=${socket.id}`);
  });

  socket.on("disconnect", (reason) => {
    log(`disconnect ${socket.id} (${reason})`);
    leaveCurrentRoom(socket);
  });
});

setInterval(() => {
  for (const room of [...rooms.values()]) {
    if (room.expiresAt <= now()) expireRoom(room);
  }
}, SWEEP_MS).unref();

httpServer.listen(PORT, "0.0.0.0", () => {
  log(`listening on http://0.0.0.0:${PORT} (ttl ${ROOM_TTL_MS / 3600000}h idle)`);
});
