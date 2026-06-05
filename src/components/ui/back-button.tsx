"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({ label = "返回" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-[#76584e] shadow backdrop-blur transition hover:bg-[#fff0e8]"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
