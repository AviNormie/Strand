import { AiSees } from "@/components/landing/AiSees";
import { Collect } from "@/components/landing/Collect";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { GsapProvider } from "@/components/landing/GsapProvider";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Intro } from "@/components/landing/Intro";
import { Pricing } from "@/components/landing/Pricing";
import { Projects } from "@/components/landing/Projects";
import { SiteNav } from "@/components/landing/SiteNav";
import { VisibilityControl } from "@/components/landing/VisibilityControl";

export default function HomePage() {
  return (
    <GsapProvider>
      <div className="bg-paper text-ink">
        <SiteNav />
        <main>
          <Hero />
          <Collect />
          <Intro />
          <VisibilityControl />
          <AiSees />
          <Projects />
          <HowItWorks />
          <Pricing />
          <Faq />
          <FinalCta />
        </main>
      </div>
    </GsapProvider>
  );
}
