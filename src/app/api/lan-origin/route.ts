import { networkInterfaces } from "node:os";
import type { NextRequest } from "next/server";

function lanIPv4() {
  const ips: string[] = [];

  for (const addrs of Object.values(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family === "IPv4" && !addr.internal) ips.push(addr.address);
    }
  }

  return (
    ips.find((ip) => ip.startsWith("192.168.")) ??
    ips.find((ip) => ip.startsWith("10.")) ??
    ips.find((ip) => /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) ??
    ips[0] ??
    null
  );
}

export async function GET(request: NextRequest) {
  const ip = lanIPv4();
  const { protocol, port } = request.nextUrl;
  const portPart = port ? `:${port}` : "";
  const origin = ip ? `${protocol}//${ip}${portPart}` : request.nextUrl.origin;

  return Response.json({ origin, ip });
}
