import { AppFooter } from "../components/app-footer";
import { AppHeader } from "../components/app-header";
import { ArchitectureSection } from "../components/architecture-section";
import { HeroSection } from "../components/hero-section";
import { LearningSection } from "../components/learning-section";
import { PracticeSection } from "../components/practice-section";

export function App() {
  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <AppHeader />
      <main>
        <HeroSection />
        <PracticeSection />
        <LearningSection />
        <ArchitectureSection />
      </main>
      <AppFooter />
    </div>
  );
}
