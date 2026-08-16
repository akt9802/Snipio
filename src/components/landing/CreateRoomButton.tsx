"use client";

import { useRouter } from "next/navigation";
import type { ButtonHTMLAttributes } from "react";
import { generateRoomId, roomPath } from "@/lib/roomId";

export default function CreateRoomButton({
  children,
  onClick,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const router = useRouter();

  return (
    <button
      type={type}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        router.push(roomPath(generateRoomId(), "host"));
      }}
    >
      {children}
    </button>
  );
}
