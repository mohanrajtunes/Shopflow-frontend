const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Uploads a file to Cloudinary and returns its public URL
export async function uploadImage(file) {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: "POST",
    body: data,
  });
  if (!res.ok) throw new Error("Image upload failed. Check your Cloudinary settings.");

  const json = await res.json();
  return json.secure_url;
}

// Asks Cloudinary for a smaller, optimized copy so pages load faster
export function optimized(url, width = 600) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/w_${width},c_limit,q_auto,f_auto/`);
}
