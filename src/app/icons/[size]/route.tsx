import { appIconResponse } from "@/lib/appIcon";

const SIZES = new Set(["192", "512", "512-maskable"]);

export function generateStaticParams() {
  return [...SIZES].map((size) => ({ size }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/icons/[size]">,
) {
  const { size: raw } = await params;
  if (!SIZES.has(raw)) {
    return new Response("Not found", { status: 404 });
  }

  const maskable = raw.endsWith("-maskable");
  const size = Number(raw.replace(/-maskable$/, ""));
  return appIconResponse(size, maskable);
}
