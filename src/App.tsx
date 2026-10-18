import { lazy, Suspense, useMemo } from "react";
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
import { hasWebGL } from "./three/input";

const BackgroundScene = lazy(() => import("./three/BackgroundScene"));

export default function App() {
  const reduce = !!useReducedMotion();
  const webgl = useMemo(() => hasWebGL(), []);

  return (
    <MotionConfig reducedMotion="user">
      {webgl && (
        <SafeBoundary>
          <Suspense fallback={null}>
            <BackgroundScene reduce={reduce} />
          </Suspense>
        </SafeBoundary>
      )}
      <CursorGlow />
      <ScrollProgress />
      <Nav />
      <div className="relative z-10">
        <main>
          <Hero />
          <About />
          <Projects />
          <Skills />
          <Certifications />
          <Education />
          <Contact />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
