import { ContactsSection } from '@/sections/info/ContactsSection';

export function SiteFooter() {
  return (
    <footer className="surface-night">
      <ContactsSection />
      <div className="container">
        <p className="disclaimer">
          AutoDrive — учебный пример. Машины, цены и контакты вымышленные.
        </p>
      </div>
    </footer>
  );
}
