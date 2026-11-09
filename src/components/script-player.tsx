"use client";

import {
  Headphones,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SPEED_PRESETS,
  type HighlightMode,
} from "@/lib/tts/settings";
import { SKIP_SECONDS, type SpeechPlayer } from "@/lib/tts/use-speech-player";

const DEFAULT_VOICE = "__default__";

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

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
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
            disabled={disabled}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
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
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm">
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <Switch
        aria-label={label}
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}

function SettingsPanel({ player }: { player: SpeechPlayer }) {
  const { settings, updateSettings } = player;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Pitch</span>
          <span className="text-muted-foreground tabular-nums">
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
            updateSettings({ pitch: Array.isArray(value) ? value[0] : value })
          }
        />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Highlight</div>
        <div className="grid grid-cols-3 gap-1">
          {HIGHLIGHT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={settings.highlight === option.value ? "default" : "outline"}
              aria-pressed={settings.highlight === option.value}
              onClick={() => updateSettings({ highlight: option.value })}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

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
    </div>
  );
}

/** The listening controls. All the work is done by the speech player. */
export function ScriptPlayer({ player }: { player: SpeechPlayer }) {
  const { supported, settings, updateSettings, voices } = player;
  const [scrub, setScrub] = useState<number | null>(null);

  const voiceItems = [
    { value: DEFAULT_VOICE, label: "System default" },
    ...voices.map((voice) => ({
      value: voice.name,
      label: `${voice.name} (${voice.lang})`,
    })),
  ];
  const speedItems = SPEED_PRESETS.map((speed) => ({
    value: String(speed),
    label: `${speed}x`,
  }));

  const shownSeconds = scrub ?? player.elapsedSeconds;

  return (
    <section
      aria-label="Listen to this script"
      className="sticky bottom-4 z-30 mt-10 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Headphones className="size-4" />
        Listen
      </div>

      {!supported && (
        <p className="mb-3 text-sm text-destructive">
          This browser can&apos;t read text aloud. Try Chrome on Android or
          desktop.
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <IconButton
            label={`Back ${SKIP_SECONDS} seconds`}
            disabled={!supported}
            onClick={() => player.skip(-SKIP_SECONDS)}
          >
            <RotateCcw />
          </IconButton>

          <Button
            size="icon-lg"
            className="size-11 rounded-full"
            aria-label={player.playing ? "Pause" : "Play"}
            disabled={!supported}
            onClick={player.toggle}
          >
            {player.playing ? (
              <Pause className="size-5" />
            ) : (
              <Play className="size-5" />
            )}
          </Button>

          <IconButton
            label={`Forward ${SKIP_SECONDS} seconds`}
            disabled={!supported}
            onClick={() => player.skip(SKIP_SECONDS)}
          >
            <RotateCw />
          </IconButton>
        </div>

        <div className="flex items-center gap-2">
          <Select
            items={voiceItems}
            value={settings.voiceName || DEFAULT_VOICE}
            onValueChange={(value) =>
              value &&
              updateSettings({ voiceName: value === DEFAULT_VOICE ? "" : value })
            }
          >
            <SelectTrigger aria-label="Voice" size="sm" className="max-w-36">
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

          <Select
            items={speedItems}
            value={String(settings.rate)}
            onValueChange={(value) =>
              value && updateSettings({ rate: Number(value) })
            }
          >
            <SelectTrigger aria-label="Speed" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {speedItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Player settings"
                />
              }
            >
              <SlidersHorizontal />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <SettingsPanel player={player} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {player.error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          Speech stopped: {player.error}. Press play to try again.
        </p>
      )}
    </section>
  );
}
