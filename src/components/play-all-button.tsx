"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { requestAutoplay } from "@/lib/tts/autoplay";

/**
 * Starts the playlist from the top. The first script opens and begins at once,
 * and each one after it follows by itself.
 */
export function PlayAllButton({ firstId }: { firstId: string }) {
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        requestAutoplay(firstId);
        router.push(`/scripts/${firstId}`);
      }}
      className="h-11 shrink-0 rounded-full px-5 text-base shadow-sm"
    >
      <Play className="size-4 fill-current" data-icon="inline-start" />
      Play all
    </Button>
  );
}
