export type DeviceRole = "host" | "tablet" | "extension";

export type RoomDevice = {
  id: string;
  role: DeviceRole;
};

export type PresencePayload = {
  roomId: string;
  deviceCount: number;
  devices: RoomDevice[];
};

export type RoomErrorCode = "unknown_room" | "expired" | "full" | "invalid_id";

export type RoomErrorPayload = {
  code: RoomErrorCode;
  message: string;
};

export type SlidePayload = {
  id: string;
  mime: string;
  bytes: string;
  createdAt: number;
};

export type RoomCreatePayload = {
  roomId: string;
};

export type RoomJoinPayload = {
  roomId: string;
  role?: Exclude<DeviceRole, "host">;
};
