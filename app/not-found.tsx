import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background">
      {/* Decorative blobs */}
      <div className="absolute -left-20 -top-20 size-72 rounded-full bg-primary/10 blur-sm" />
      <div className="absolute -bottom-16 -right-16 size-64 rounded-full bg-primary/10 blur-sm" />

      <div className="relative z-10 mx-4 flex flex-col items-center text-center">
        <p className="text-8xl font-bold text-primary/20">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <Link href="/" className="mt-6">
          <Button className="rounded-full px-6">
            Kembali ke Login
          </Button>
        </Link>
      </div>
    </div>
  );
}
