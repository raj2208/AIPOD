import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { DeleteScriptButton } from "@/components/delete-script-button";
import { ScriptPlayer } from "@/components/script-player";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getScript } from "@/lib/scripts";
import { cn } from "@/lib/utils";

// Rough length of the spoken script, at about 150 words per minute.
const WORDS_PER_MINUTE = 150;

function estimateSpeechSeconds(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.round((words / WORDS_PER_MINUTE) * 60);
}

async function ScriptDetail({
  params,
}: {
  params: PageProps<"/scripts/[id]">["params"];
}) {
  await connection();
  const { id } = await params;
  const script = await getScript(id);
  if (!script) notFound();

  const paragraphs = script.content.split(/\n{2,}/);
  const estimatedSeconds = estimateSpeechSeconds(script.content);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="secondary">{script.topic}</Badge>
          <h1 className="text-3xl font-semibold">{script.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/scripts/${script.id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Pencil data-icon="inline-start" />
            Edit
          </Link>
          <DeleteScriptButton id={script.id} title={script.title} />
        </div>
      </div>

      <article className="space-y-4 text-lg leading-relaxed">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>

      <ScriptPlayer totalSeconds={estimatedSeconds} />
    </>
  );
}

function ScriptDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function ScriptPage(props: PageProps<"/scripts/[id]">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link
        href="/scripts"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All scripts
      </Link>

      <Suspense fallback={<ScriptDetailSkeleton />}>
        <ScriptDetail params={props.params} />
      </Suspense>
    </main>
  );
}
