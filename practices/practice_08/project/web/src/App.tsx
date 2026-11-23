import { CursorGlow } from '@/components/CursorGlow';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { HeroSection } from '@/sections/hero/HeroSection';
import { FleetSection } from '@/sections/fleet/FleetSection';
import { CalculatorSection } from '@/sections/calculator/CalculatorSection';
import { BookingSection } from '@/sections/booking/BookingSection';
import { BenefitsSection } from '@/sections/info/BenefitsSection';
import { HowSection } from '@/sections/info/HowSection';
import { FaqSection } from '@/sections/info/FaqSection';
import { AppProvider } from '@/state/rental';

export function App() {
  return (
    <AppProvider>
      <div className="app">
        <CursorGlow />
        <SiteHeader />
        <main>
          <HeroSection />
          <FleetSection />
          <CalculatorSection />
          <BookingSection />
          <BenefitsSection />
          <HowSection />
          <FaqSection />
        </main>
        <SiteFooter />
      </div>
    </AppProvider>
  );
}
