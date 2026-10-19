import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import GameBoot from "./components/GameBoot";
import { MotionConfig, useReducedMotion } from "framer-motion";
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

const BackgroundScene = lazy(() => import("./three/BackgroundScene"));
// Easter-egg game: downloaded only after the secret is triggered.
const RegionDefender = lazy(() => import("./game/RegionDefender"));

export default function App() {
  const reduce = !!useReducedMotion();
  const webgl = useMemo(() => hasWebGL(), []);
  const lite = useMemo(() => isLiteDevice(), []);
  const [game, setGame] = useState(false);
  const closeGame = useCallback(() => setGame(false), []);

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
      <Nav />
      <div className="relative z-10">
        <main>
          <Hero onSecret={() => setGame(true)} />
          <About />
          <Projects />
          <Skills />
          <Certifications />
          <Education />
          <Contact />
        </main>
        <Footer />
      </div>
      {game && (
        <SafeBoundary fallback={null}>
          <Suspense fallback={<GameBoot />}>
            <RegionDefender onClose={closeGame} lite={lite} />
          </Suspense>
        </SafeBoundary>
      )}
    </MotionConfig>
  );
}
