export async function uploadImage(
  businessId: string,
  file: File,
  folder = "cms"
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessId,
      folder,
      filename: file.name,
      dataUrl,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "Upload failed");
  return data.url as string;
}
