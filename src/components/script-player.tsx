"use client";

import { Headphones, Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SPEEDS = [
  { value: "0.75", label: "0.75x" },
  { value: "1", label: "1x" },
  { value: "1.25", label: "1.25x" },
  { value: "1.5", label: "1.5x" },
  { value: "1.75", label: "1.75x" },
  { value: "2", label: "2x" },
  { value: "2.5", label: "2.5x" },
  { value: "3", label: "3x" },
];

const VOICES = [{ value: "default", label: "System default" }];

const SKIP_SECONDS = 15;

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The listening controls for a script.
 *
 * This is the interface only. It keeps its own state so the buttons respond,
 * but nothing is spoken yet. Text-to-speech will be connected later.
 */
export function ScriptPlayer({ totalSeconds }: { totalSeconds: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState("1");
  const [voice, setVoice] = useState("default");

  const skip = (seconds: number) =>
    setElapsed((current) => Math.min(totalSeconds, Math.max(0, current + seconds)));

  return (
    <section
      aria-label="Listen to this script"
      className="sticky bottom-4 z-30 mt-10 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Headphones className="size-4" />
        Listen
      </div>

      <div className="flex items-center gap-3">
        <span className="w-10 text-xs text-muted-foreground tabular-nums">
          {formatTime(elapsed)}
        </span>
        <Slider
          aria-label="Playback position"
          min={0}
          max={totalSeconds}
          value={[elapsed]}
          onValueChange={(value) =>
            setElapsed(Array.isArray(value) ? value[0] : value)
          }
        />
        <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
          {formatTime(totalSeconds)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <IconButton
            label={`Back ${SKIP_SECONDS} seconds`}
            onClick={() => skip(-SKIP_SECONDS)}
          >
            <RotateCcw />
          </IconButton>

          <Button
            size="icon-lg"
            className="size-11 rounded-full"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={() => setIsPlaying((playing) => !playing)}
          >
            {isPlaying ? (
              <Pause className="size-5" />
            ) : (
              <Play className="size-5" />
            )}
          </Button>

          <IconButton
            label={`Forward ${SKIP_SECONDS} seconds`}
            onClick={() => skip(SKIP_SECONDS)}
          >
            <RotateCw />
          </IconButton>
        </div>

        <div className="flex items-center gap-2">
          <Select
            items={VOICES}
            value={voice}
            onValueChange={(value) => value && setVoice(value)}
          >
            <SelectTrigger aria-label="Voice" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={SPEEDS}
            value={speed}
            onValueChange={(value) => value && setSpeed(value)}
          >
            <SelectTrigger aria-label="Speed" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEEDS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Preview only. Playback is not connected yet.
      </p>
    </section>
  );
}
