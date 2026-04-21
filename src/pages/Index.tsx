import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import heroGlobe from '@/assets/hero-globe.jpg';
import vggLogo from '@/assets/vgg-logo.webp';

const Index = () => {
  return (
    <div className="app-page flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-10 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img src={vggLogo} alt="VGG" className="h-6 w-auto sm:h-7" />
          <div className="hidden h-5 w-px bg-border sm:block" />
          <span className="font-mono hidden sm:inline text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
            ◉ VGG / 360° / Performance Edition
          </span>
        </div>
        <span className="font-mono text-[10px] sm:text-[10.5px] uppercase tracking-[0.2em] sm:tracking-[0.22em] text-muted-foreground whitespace-nowrap">
          Vol. 01
        </span>
      </header>

      <main className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        <section className="flex flex-col justify-center px-5 py-12 sm:px-12 sm:py-16 lg:px-20">
          <span className="eyebrow-primary">◉ № 360 — Performance Intelligence</span>

          <h1 className="headline-collage display-serif mt-6 text-[clamp(2.75rem,7vw,5.5rem)] font-medium leading-[0.92] tracking-[-0.045em] text-foreground">
            A field manual for <em>honest performance.</em>
          </h1>

          <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
            Executive‑grade appraisal analytics, anonymous peer review, and AI co‑analysis — built for VGG.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button variant="green" size="lg" asChild>
              <Link to="/login">Enter Console →</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/employee-login">Employee Sign In</Link>
            </Button>
          </div>
        </section>

        <section className="relative min-h-[280px] sm:min-h-[360px] border-border p-5 sm:p-6 lg:border-l lg:p-12">
          <div className="ink-frame relative h-full w-full overflow-hidden">
            <img
              src={heroGlobe}
              alt="Editorial globe — atlas of what's possible"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </section>
      </main>

      <footer className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-10 sm:py-4">
        <span className="font-mono text-[10px] sm:text-[10.5px] uppercase tracking-[0.2em] sm:tracking-[0.22em] text-muted-foreground truncate">
          © Venture Garden Group
        </span>
        <span className="font-mono text-[10px] sm:text-[10.5px] uppercase tracking-[0.2em] sm:tracking-[0.22em] text-muted-foreground whitespace-nowrap">
          appraisal.vgg.app
        </span>
      </footer>
    </div>
  );
};

export default Index;
