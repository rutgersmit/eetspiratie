import { IMAGE_CONTENT_TYPES, readImage } from "@/lib/images";

// Image names are random UUIDs, so a URL is only known to someone who was
// shown the image (comparable to the signed URLs used before). No session
// check here: the Next.js image optimizer fetches these without cookies.
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const data = await readImage(file);
  if (!data) return new Response("Not found", { status: 404 });

  const ext = file.split(".").pop()!;
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": IMAGE_CONTENT_TYPES[ext],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
