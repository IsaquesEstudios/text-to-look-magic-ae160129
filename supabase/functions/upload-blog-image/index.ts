import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE = 5 * 1024 * 1024;

const mimeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let fileBuffer: ArrayBuffer;
    let fileType: string;
    let fileExt: string;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // --- Form data (original flow) ---
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) return errorResponse("No file provided", 400);
      if (!allowedTypes.includes(file.type)) {
        return errorResponse("Invalid file type. Allowed: jpeg, png, webp, gif, avif", 400);
      }
      if (file.size > MAX_SIZE) return errorResponse("File too large. Max 5MB", 400);
      fileBuffer = await file.arrayBuffer();
      fileType = file.type;
      fileExt = file.name.split(".").pop() || mimeToExt[file.type] || "jpg";

    } else if (contentType.includes("application/json")) {
      // --- JSON with base64 ---
      const body = await req.json();
      const { image, contentType: ct, filename } = body;
      if (!image) return errorResponse("Missing 'image' field with base64 data", 400);
      const resolvedType = ct || "image/jpeg";
      if (!allowedTypes.includes(resolvedType)) {
        return errorResponse("Invalid file type. Allowed: jpeg, png, webp, gif, avif", 400);
      }
      // Strip data URI prefix if present
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fileBuffer = bytes.buffer;
      if (fileBuffer.byteLength > MAX_SIZE) return errorResponse("File too large. Max 5MB", 400);
      fileType = resolvedType;
      fileExt = filename?.split(".").pop() || mimeToExt[resolvedType] || "jpg";

    } else {
      // --- Binary / raw body (image/*, octet-stream, etc.) ---
      fileBuffer = await req.arrayBuffer();
      if (fileBuffer.byteLength === 0) return errorResponse("Empty body", 400);
      if (fileBuffer.byteLength > MAX_SIZE) return errorResponse("File too large. Max 5MB", 400);

      // Resolve type from Content-Type header or default to jpeg
      let resolvedType = contentType.split(";")[0].trim();
      if (!allowedTypes.includes(resolvedType)) {
        resolvedType = "image/jpeg"; // fallback for octet-stream etc.
      }
      fileType = resolvedType;
      fileExt = mimeToExt[resolvedType] || "jpg";
    }

    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(filePath, fileBuffer, {
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("blog-images")
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({ success: true, url: urlData.publicUrl, path: filePath }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("upload-blog-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
