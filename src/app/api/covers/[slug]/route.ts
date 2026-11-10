import { connection } from "next/server";

import { getCover } from "@/lib/collections";

/**
 * A collection's cover image, as it was stored by the last sync. The url
 * carries the image's hash, so a cover can be cached for good: a new image
 * means a new url.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/covers/[slug]">,
) {
  await connection();
  const { slug } = await params;
  const cover = await getCover(slug);
  if (!cover) return new Response("No cover", { status: 404 });

  return new Response(new Uint8Array(cover.data), {
    headers: {
      "Content-Type": cover.type,
      "Content-Length": String(cover.data.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: `"${cover.hash}"`,
    },
  });
}
