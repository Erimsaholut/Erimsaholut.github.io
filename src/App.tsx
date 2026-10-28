import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion";
import GameBoot from "./components/GameBoot";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import About from "./components/About";
import Tagline from "./components/Tagline";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import Education from "./components/Education";
import Certifications from "./components/Certifications";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import { ScrollProgress } from "./components/Effects";
import SafeBoundary from "./three/SafeBoundary";
import { hasWebGL, isLiteDevice } from "./three/input";
import { SecretToasts, SecretsPanel } from "./secrets/SecretsUI";
import { REWARD_SEEN_KEY, unlock, useSecrets } from "./secrets/store";
import { SECRETS } from "./secrets/registry";
import { useSpeedrun } from "./secrets/speedrun";
import { useShakeForChaos } from "./secrets/chaos";

const BackgroundScene = lazy(() => import("./three/BackgroundScene"));
// Easter eggs: each is downloaded only when it's triggered.
const RegionDefender = lazy(() => import("./game/RegionDefender"));
const Terminal = lazy(() => import("./terminal/Terminal"));
const NightShift = lazy(() => import("./adventure/NightShift"));
const Reward = lazy(() => import("./secrets/Reward"));

export default function App() {
  const reduce = !!useReducedMotion();
  const webgl = useMemo(() => hasWebGL(), []);
  const lite = useMemo(() => isLiteDevice(), []);
  useSpeedrun();
  useShakeForChaos(lite);
  const [game, setGame] = useState(false);
  const [terminal, setTerminal] = useState(false);
  const [secrets, setSecrets] = useState(false);
  const [adventure, setAdventure] = useState(false);
  const [reward, setReward] = useState(false);

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
  const openAdventure = useCallback(() => setAdventure(true), []);
  const closeAdventure = useCallback(() => setAdventure(false), []);
  const closeReward = useCallback(() => setReward(false), []);
  const openReward = useCallback(() => {
    setSecrets(false);
    setReward(true);
  }, []);

  // Finding every secret pops the reward up once, after the last toast has had its moment.
  const { found } = useSecrets();
  const allFound = SECRETS.every((s) => found[s.id]);
  useEffect(() => {
    if (!allFound) return;
    try {
      if (localStorage.getItem(REWARD_SEEN_KEY)) return;
    } catch {
      /* no storage — show it anyway */
    }
    const t = setTimeout(() => {
      setReward(true);
      try {
        localStorage.setItem(REWARD_SEEN_KEY, "1");
      } catch {
        /* fine */
      }
    }, 2800);
    return () => clearTimeout(t);
  }, [allFound]);

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      {webgl && !lite && (
        <SafeBoundary>
          <Suspense fallback={null}>
            <BackgroundScene reduce={reduce} />
          </Suspense>
        </SafeBoundary>
      )}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-amber focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <Nav onLogoSecret={openTerminal} />
      <div className="relative z-10">
        <main id="main" tabIndex={-1} className="outline-none">
          <Hero onSecret={openGameFromTitle} />
          <About />
          <Tagline />
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
              <Terminal onClose={closeTerminal} onPlay={playFromTerminal} onAdventure={openAdventure} />
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
      <AnimatePresence>
        {adventure && (
          <SafeBoundary key="adventure" fallback={null}>
            <Suspense fallback={<GameBoot label="Loading Night Shift" variant="story" />}>
              <NightShift onClose={closeAdventure} />
            </Suspense>
          </SafeBoundary>
        )}
      </AnimatePresence>
      <SecretsPanel open={secrets} onClose={closeSecrets} onReward={openReward} />
      <AnimatePresence>
        {reward && (
          <SafeBoundary key="reward" fallback={null}>
            <Suspense fallback={null}>
              <Reward onClose={closeReward} />
            </Suspense>
          </SafeBoundary>
        )}
      </AnimatePresence>
      <SecretToasts />
    </MotionConfig>
  );
}
