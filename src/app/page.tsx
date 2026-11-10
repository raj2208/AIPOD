import { Hero } from "@/components/hero";
import { NoteToScript } from "@/components/note-to-script";
import { NotesDiagram } from "@/components/notes-diagram";

export default function HomePage() {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <Hero />
      <NoteToScript />
      <NotesDiagram />
    </main>
  );
}
