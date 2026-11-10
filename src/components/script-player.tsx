"use client";

import { Pause, Play, RotateCcw, RotateCw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  SPEED_PRESETS,
  formatSpeed,
  nextSpeed,
  type HighlightMode,
  type TextSize,
} from "@/lib/tts/settings";
import { SKIP_SECONDS, type SpeechPlayer } from "@/lib/tts/use-speech-player";
import { cn } from "@/lib/utils";

const DEFAULT_VOICE = "__default__";

const TEXT_SIZE_OPTIONS: { value: TextSize; name: string; sample: string }[] = [
  { value: "small", name: "Small", sample: "text-sm" },
  { value: "medium", name: "Medium", sample: "text-base" },
  { value: "large", name: "Large", sample: "text-xl" },
  { value: "huge", name: "Extra large", sample: "text-2xl" },
];

const HIGHLIGHT_OPTIONS: { value: HighlightMode; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "sentence", label: "Sentence" },
  { value: "word", label: "Word" },
];

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/** A skip arrow with the number of seconds written inside it. */
function SkipButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "back" | "forward";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "back" ? RotateCcw : RotateCw;
  return (
    <Button
      variant="ghost"
      aria-label={`${direction === "back" ? "Back" : "Forward"} ${SKIP_SECONDS} seconds`}
      disabled={disabled}
      onClick={onClick}
      className="relative size-12 rounded-full"
    >
      <Icon className="size-7" strokeWidth={1.6} />
      <span
        aria-hidden
        className="absolute text-[0.6875rem] leading-none font-bold tabular-nums"
      >
        {SKIP_SECONDS}
      </span>
    </Button>
  );
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4">
      <div>
        <div className="font-medium">{label}</div>
        {hint && <div className="text-sm text-muted-foreground">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function SettingSwitch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <SettingRow label={label} hint={hint}>
      <Switch aria-label={label} checked={checked} onCheckedChange={onChange} />
    </SettingRow>
  );
}

/** Choose one option out of a few, as big tappable buttons. */
function Choice<T extends string | number>({
  label,
  options,
  value,
  onChange,
  columns,
}: {
  label: string;
  options: { value: T; label: React.ReactNode; ariaLabel?: string }[];
  value: T;
  onChange: (value: T) => void;
  columns: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("grid gap-2", columns)}>
      {options.map((option) => (
        <Button
          key={String(option.value)}
          variant={value === option.value ? "default" : "outline"}
          aria-pressed={value === option.value}
          aria-label={option.ariaLabel}
          onClick={() => onChange(option.value)}
          className="h-11 text-sm"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function SettingsSheet({ player }: { player: SpeechPlayer }) {
  const { settings, updateSettings, voices } = player;

  const voiceItems = [
    { value: DEFAULT_VOICE, label: "System default" },
    ...voices.map((voice) => ({
      value: voice.name,
      label: `${voice.name} (${voice.lang})`,
    })),
  ];

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            aria-label="Player settings"
            className="size-12 rounded-full"
          />
        }
      >
        <SlidersHorizontal className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[88dvh] gap-0 overflow-y-auto rounded-t-3xl px-5 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <div aria-hidden className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        <SheetHeader className="px-0 pb-4">
          <SheetTitle className="text-lg">Playback</SheetTitle>
          <SheetDescription className="sr-only">
            Speed, voice, and how the text follows along.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="font-medium">Speed</h3>
            <Choice
              label="Speed"
              columns="grid-cols-4"
              options={SPEED_PRESETS.map((speed) => ({
                value: speed,
                label: formatSpeed(speed),
              }))}
              value={settings.rate}
              onChange={(rate) => updateSettings({ rate })}
            />
          </section>

          <section className="space-y-3">
            <h3 className="font-medium">Text size</h3>
            <Choice
              label="Text size"
              columns="grid-cols-4"
              options={TEXT_SIZE_OPTIONS.map((option) => ({
                value: option.value,
                ariaLabel: option.name,
                label: <span className={option.sample}>Aa</span>,
              }))}
              value={settings.textSize}
              onChange={(textSize) => updateSettings({ textSize })}
            />
          </section>

          <section className="space-y-3">
            <h3 className="font-medium">Voice</h3>
            <Select
              items={voiceItems}
              value={settings.voiceName || DEFAULT_VOICE}
              onValueChange={(value) =>
                value &&
                updateSettings({
                  voiceName: value === DEFAULT_VOICE ? "" : value,
                })
              }
            >
              <SelectTrigger aria-label="Voice" className="h-11 w-full text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voiceItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Pitch</h3>
              <span className="text-sm text-muted-foreground tabular-nums">
                {settings.pitch.toFixed(1)}
              </span>
            </div>
            <Slider
              aria-label="Pitch"
              min={0.5}
              max={2}
              step={0.1}
              defaultValue={[settings.pitch]}
              onValueCommitted={(value) =>
                updateSettings({
                  pitch: Array.isArray(value) ? value[0] : value,
                })
              }
            />
          </section>

          <section className="space-y-3">
            <h3 className="font-medium">Highlight while reading</h3>
            <Choice
              label="Highlight"
              columns="grid-cols-3"
              options={HIGHLIGHT_OPTIONS}
              value={settings.highlight}
              onChange={(highlight) => updateSettings({ highlight })}
            />
          </section>

          <section className="divide-y">
            <SettingSwitch
              label="Auto-scroll"
              hint="Follow the sentence being read."
              checked={settings.autoScroll}
              onChange={(autoScroll) => updateSettings({ autoScroll })}
            />
            <SettingSwitch
              label="Play next script"
              hint="Start the next script when one ends."
              checked={settings.autoPlayNext}
              onChange={(autoPlayNext) => updateSettings({ autoPlayNext })}
            />
            <SettingSwitch
              label="Keep screen on"
              hint="Stops the phone sleeping. Uses more battery."
              checked={settings.keepScreenOn}
              onChange={(keepScreenOn) => updateSettings({ keepScreenOn })}
            />
            <SettingSwitch
              label="Background audio"
              hint="Experimental. Helps playback continue with the screen off."
              checked={settings.backgroundAudio}
              onChange={(backgroundAudio) => updateSettings({ backgroundAudio })}
            />
          </section>

          <p className="hidden text-sm text-muted-foreground lg:block">
            On a keyboard: <kbd className="rounded border px-1.5 py-0.5 text-xs">Space</kbd>{" "}
            play or pause, <kbd className="rounded border px-1.5 py-0.5 text-xs">←</kbd>{" "}
            <kbd className="rounded border px-1.5 py-0.5 text-xs">→</kbd> skip {SKIP_SECONDS}{" "}
            seconds, <kbd className="rounded border px-1.5 py-0.5 text-xs">N</kbd> next script.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * The listening controls, docked to the bottom of the screen where a thumb
 * reaches. Everything used on every listen is here; the rest is in a sheet.
 */
export function ScriptPlayer({ player }: { player: SpeechPlayer }) {
  const { supported, settings, updateSettings } = player;
  const [scrub, setScrub] = useState<number | null>(null);
  const shownSeconds = scrub ?? player.elapsedSeconds;

  return (
    <section
      aria-label="Listen to this script"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.15)]"
    >
      <div className="mx-auto w-full max-w-2xl px-4 pt-1.5 pb-2 lg:max-w-5xl lg:pl-[calc(1rem+var(--rail)+var(--rail-gap))]">
        {!supported && (
          <p className="py-2 text-sm text-destructive">
            This browser can&apos;t read text aloud. Try Chrome on Android or
            desktop.
          </p>
        )}
        {player.error && (
          <p role="alert" className="py-2 text-sm text-destructive">
            Speech stopped: {player.error}. Press play to try again.
          </p>
        )}

        <div className="flex items-center gap-3">
          <span className="w-10 text-xs text-muted-foreground tabular-nums">
            {formatTime(shownSeconds)}
          </span>
          <Slider
            aria-label="Playback position"
            disabled={!supported}
            min={0}
            max={Math.max(1, Math.round(player.totalSeconds))}
            value={[Math.round(shownSeconds)]}
            onValueChange={(value) =>
              setScrub(Array.isArray(value) ? value[0] : value)
            }
            onValueCommitted={(value) => {
              player.seekToSeconds(Array.isArray(value) ? value[0] : value);
              setScrub(null);
            }}
          />
          <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
            {formatTime(player.totalSeconds)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            aria-label={`Speed ${formatSpeed(settings.rate)}. Tap to change.`}
            disabled={!supported}
            onClick={() => updateSettings({ rate: nextSpeed(settings.rate) })}
            className="h-11 min-w-14 rounded-full px-3 text-sm font-semibold tabular-nums"
          >
            {formatSpeed(settings.rate)}
          </Button>

          <div className="flex items-center gap-1 sm:gap-3">
            <SkipButton
              direction="back"
              disabled={!supported}
              onClick={() => player.skip(-SKIP_SECONDS)}
            />
            <Button
              aria-label={player.playing ? "Pause" : "Play"}
              disabled={!supported}
              onClick={player.toggle}
              className="size-16 rounded-full shadow-md transition-transform active:scale-95"
            >
              {player.playing ? (
                <Pause className="size-7 fill-current" />
              ) : (
                <Play className="size-7 translate-x-0.5 fill-current" />
              )}
            </Button>
            <SkipButton
              direction="forward"
              disabled={!supported}
              onClick={() => player.skip(SKIP_SECONDS)}
            />
          </div>

          <SettingsSheet player={player} />
        </div>
      </div>
    </section>
  );
}
