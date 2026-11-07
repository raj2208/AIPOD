import { Headphones, NotebookPen, Sparkles } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STEPS = [
  {
    icon: NotebookPen,
    title: "You write the notes",
    description:
      "Study a topic on your own and keep your notes as markdown files. What goes in them is entirely your call.",
  },
  {
    icon: Sparkles,
    title: "AI makes them flow",
    description:
      "Bullet points and headings become connected spoken paragraphs. The AI changes how it reads, never what it says.",
  },
  {
    icon: Headphones,
    title: "You listen and revise",
    description:
      "Put your earphones in and revise from audio alone, on the train, in the car, or on a walk.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Three steps, and only one of them is yours to do.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <Card key={step.title}>
            <CardHeader>
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <step.icon className="size-5" />
                <span className="text-xs font-medium">Step {index + 1}</span>
              </div>
              <CardTitle>{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
