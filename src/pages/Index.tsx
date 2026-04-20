import { Link } from 'react-router-dom';
import heroOnboarding from '@/assets/hero-onboarding.jpg';

const Index = () => {
  return (
    <div className="app-page flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-foreground/15 px-6 py-4 sm:px-10">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/70">
          VGG / 360° / Performance Edition
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
          Vol. 01
        </span>
      </header>

      <main className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        <section className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/70">
            № 360 — Performance Intelligence
          </span>
          <h1 className="mt-6 font-serif text-[clamp(3rem,7vw,6rem)] font-extrabold leading-[0.9] tracking-[-0.03em]">
            A field manual <br />
            for honest <br />
            performance.
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-foreground/70">
            Executive‑grade appraisal analytics, anonymous peer review, and AI co‑analysis — built for VGG.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex h-12 items-center gap-2 rounded-sm bg-foreground px-6 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-background transition-transform hover:-translate-y-0.5"
            >
              Enter Console →
            </Link>
            <Link
              to="/employee-login"
              className="inline-flex h-12 items-center gap-2 rounded-sm border border-foreground/30 px-6 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
            >
              Employee Sign In
            </Link>
          </div>
        </section>

        <section className="relative min-h-[360px] overflow-hidden border-foreground/15 lg:border-l">
          <img
            src={heroOnboarding}
            alt="Editorial graphic art: emerald circle, ember triangle, ink grid"
            width={1536}
            height={1536}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </section>
      </main>

      <footer className="flex items-center justify-between border-t border-foreground/15 px-6 py-4 sm:px-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
          © Venture Garden Group
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
          appraisal.vgg.app
        </span>
      </footer>
    </div>
  );
};

export default Index;
