import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { NotesDiagram } from "@/components/notes-diagram";

export default function HomePage() {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <Hero />
      <HowItWorks />
      <NotesDiagram />
    </main>
  );
}
