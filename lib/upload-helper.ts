import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "./uploadthing";

const { uploadFiles } = genUploader<OurFileRouter>();

export async function uploadMenuImage(file: File): Promise<string> {
  if (file.size > 1 * 1024 * 1024) {
    throw new Error("Ukuran file maksimal 1MB");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar");
  }

  const result = await uploadFiles("menuImage", { files: [file] });
  const url = result?.[0]?.url;
  if (!url) throw new Error("Upload gagal — URL tidak ditemukan");
  return url;
}

export async function uploadQrisImage(file: File): Promise<string> {
  if (file.size > 1 * 1024 * 1024) {
    throw new Error("Ukuran file maksimal 1MB");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar");
  }

  const result = await uploadFiles("qrisImage", { files: [file] });
  const url = result?.[0]?.url;
  if (!url) throw new Error("Upload gagal — URL tidak ditemukan");
  return url;
}
