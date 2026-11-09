import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";

export default function HomePage() {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <Hero />
      <HowItWorks />
    </main>
  );
}
