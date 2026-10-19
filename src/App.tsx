import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion";
import GameBoot from "./components/GameBoot";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import About from "./components/About";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import Education from "./components/Education";
import Certifications from "./components/Certifications";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import { CursorGlow, ScrollProgress } from "./components/Effects";
import SafeBoundary from "./three/SafeBoundary";
import { hasWebGL, isLiteDevice } from "./three/input";
import { SecretToasts, SecretsPanel } from "./secrets/SecretsUI";
import { unlock } from "./secrets/store";
import { useSpeedrun } from "./secrets/speedrun";
import { useShakeForChaos } from "./secrets/chaos";

const BackgroundScene = lazy(() => import("./three/BackgroundScene"));
// Easter eggs: each is downloaded only when it's triggered.
const RegionDefender = lazy(() => import("./game/RegionDefender"));
const Terminal = lazy(() => import("./terminal/Terminal"));

export default function App() {
  const reduce = !!useReducedMotion();
  const webgl = useMemo(() => hasWebGL(), []);
  const lite = useMemo(() => isLiteDevice(), []);
  useSpeedrun();
  useShakeForChaos(lite);
  const [game, setGame] = useState(false);
  const [terminal, setTerminal] = useState(false);
  const [secrets, setSecrets] = useState(false);

  const closeGame = useCallback(() => setGame(false), []);
  const closeTerminal = useCallback(() => setTerminal(false), []);
  const closeSecrets = useCallback(() => setSecrets(false), []);
  const openGameFromTitle = useCallback(() => {
    unlock("last-letter");
    setGame(true);
  }, []);
  const openTerminal = useCallback(() => {
    unlock("terminal");
    setTerminal(true);
  }, []);
  const playFromTerminal = useCallback(() => setGame(true), []);

  // The key above Tab (physical position, so it works on any keyboard layout) toggles the terminal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Backquote" || e.ctrlKey || e.metaKey || e.altKey || game) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      e.preventDefault();
      if (terminal) setTerminal(false);
      else openTerminal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, terminal, openTerminal]);

  return (
    <MotionConfig reducedMotion="user">
      {webgl && !lite && (
        <SafeBoundary>
          <Suspense fallback={null}>
            <BackgroundScene reduce={reduce} />
          </Suspense>
        </SafeBoundary>
      )}
      {!lite && <CursorGlow />}
      <ScrollProgress />
      <Nav onLogoSecret={openTerminal} />
      <div className="relative z-10">
        <main>
          <Hero onSecret={openGameFromTitle} />
          <About />
          <Projects />
          <Skills />
          <Certifications />
          <Education />
          <Contact />
        </main>
        <Footer onSecrets={() => setSecrets(true)} />
      </div>

      <AnimatePresence>
        {terminal && (
          <SafeBoundary key="terminal" fallback={null}>
            <Suspense fallback={null}>
              <Terminal onClose={closeTerminal} onPlay={playFromTerminal} />
            </Suspense>
          </SafeBoundary>
        )}
      </AnimatePresence>
      {game && (
        <SafeBoundary fallback={null}>
          <Suspense fallback={<GameBoot />}>
            <RegionDefender onClose={closeGame} lite={lite} />
          </Suspense>
        </SafeBoundary>
      )}
      <SecretsPanel open={secrets} onClose={closeSecrets} />
      <SecretToasts />
    </MotionConfig>
  );
}
