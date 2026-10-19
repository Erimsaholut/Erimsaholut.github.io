// All site content lives here, taken from the CV. Edit this file to update the site.

export const PROFILE = {
  name: "Erimsah Olut",
  role: "Computer Engineering Student",
  school: "Politecnico di Torino",
  location: "Torino, Italy",
  email: "erimsaholut@icloud.com",
  github: { url: "https://github.com/Erimsaholut", label: "github.com/Erimsaholut" },
  linkedin: { url: "https://www.linkedin.com/in/erimsaholut", label: "linkedin.com/in/erimsaholut" },
  tagline:
    "Computer Engineering student at Politecnico di Torino, focused on cloud computing, AWS and backend systems.",
  summary:
    "I'm a Computer Engineering student at Politecnico di Torino, focused on cloud computing and AWS. I hold the AWS Certified Cloud Practitioner credential, and I've built several Flutter apps — including freelance work — on real-time Firebase backends, which taught me to turn real-world requirements into working systems. I also enjoy data analysis with Python. My goal is to grow into a solutions engineering role, and I'm looking for an internship where I can gain industry experience on real cloud problems.",
};

export const SITE_URL = "https://erimsaholut.github.io";
/** The downloadable CV in public/. Regenerate it (and the link preview image) with `npm run assets` after editing this file. */
export const CV_FILE = "Erimsah-Olut-CV.pdf";
/** Where the browser finds it (respects Vite's base path). */
export const cvUrl = () => `${import.meta.env?.BASE_URL ?? "/"}${CV_FILE}`;
/** The CV's profile paragraph — the site's summary, in CV voice. */
export const CV_SUMMARY =
  "Computer Engineering student at Politecnico di Torino, focused on cloud computing and AWS. AWS Certified Cloud Practitioner (CLF-C02). Built several Flutter apps on real-time Firebase backends — including a multilingual vending-kiosk app now running in production at Buzlime — and enjoys data analysis with Python. Aiming to grow into a solutions engineering role; looking for an internship to gain industry experience on real cloud problems.";

export const FOCUS_WORDS = ["cloud computing.", "AWS.", "backend systems."];

export const STATS = [
  { value: "AWS", label: "Certified Cloud Practitioner" },
  { value: "3.62", label: "GPA at Celal Bayar University" },
  { value: "10", label: "Certifications & courses" },
  { value: "C1", label: "English level" },
];

export const FACTS = [
  { k: "Based in", v: "Torino, Italy" },
  { k: "Studying", v: "BSc Computer Engineering, Politecnico di Torino" },
  { k: "Focus", v: "Cloud computing · AWS · Backend" },
  { k: "Also into", v: "Data analysis with Python" },
  { k: "Looking for", v: "A cloud / backend internship" },
];

export const LANGUAGES = [
  { name: "Turkish", level: "Native" },
  { name: "English", level: "Fluent — C1" },
  { name: "Italian", level: "Learning" },
];

export type ArtKind = "kiosk" | "cafe" | "chat" | "data";

export const PROJECTS: {
  title: string;
  type: string;
  art: ArtKind;
  description: string;
  highlights: string[];
  stack: string[];
  repo?: string;
  live?: { url: string; label: string };
}[] = [
  {
    title: "Vending Machine Kiosk App",
    type: "Freelance · Team project",
    art: "kiosk",
    description:
      "A multilingual self-service beverage kiosk with a real-time Firestore backend, now running in production at Buzlime — a cold-drink vending startup. I implemented both the frontend and the backend.",
    highlights: ["Multilingual self-service UI", "Real-time stock & sales tracking", "Refund and maintenance logs"],
    stack: ["Flutter", "Firebase", "Firestore"],
    live: { url: "https://buzlime.com", label: "buzlime.com" },
  },
  {
    title: "Real-Time Chat App",
    type: "Full-stack project",
    art: "chat",
    description:
      "A full-stack, real-time messaging platform built on Firebase Auth and Firestore.",
    highlights: ["Secure authentication", "User profiles", "Live group chat & friend interactions"],
    stack: ["Flutter", "Firebase Auth", "Firestore"],
  },
  {
    title: "Café Management App",
    type: "Freelance project",
    art: "cafe",
    description:
      "A local-storage-based POS and analytics system for a local café, with visual dashboards for revenue trends and product performance.",
    highlights: ["Weekly, monthly & yearly sales reports", "Order volume tracking", "Cost–profit ratio calculation"],
    stack: ["Flutter", "Local storage"],
  },
  {
    title: "Data Visualization Projects",
    type: "Data analysis",
    art: "data",
    description:
      "A series of analysis and visualization notebooks on real-world datasets: data cleaning, correlation analysis and visualization.",
    highlights: [
      "Turkish provincial data: IQ, education, divorce rates, election results",
      "Student lifestyle data: study habits, GPA and stress levels",
    ],
    stack: ["Python", "Jupyter", "Pandas", "Seaborn"],
    repo: "https://github.com/Erimsaholut/Data-Visualization-Projects",
  },
];

export const AWS_SERVICES = ["EC2", "S3", "IAM", "Lambda"];

// `foundational` marks certification-level knowledge that hasn't been used in a real project yet.
export const SKILLS: { group: string; items: string[]; foundational?: boolean; note?: string }[] = [
  { group: "Cloud & platforms", items: ["AWS", "Firebase"] },
  {
    group: "AWS services",
    items: AWS_SERVICES,
    foundational: true,
    note: "Foundational, certification-level knowledge (CLF-C02)",
  },
  { group: "Programming languages", items: ["Python", "Java", "C", "Dart", "SQL", "MATLAB"] },
  { group: "Databases", items: ["MySQL", "PostgreSQL", "Firestore"] },
  { group: "Frameworks", items: ["Flutter"] },
  { group: "Practices & tools", items: ["Object-Oriented Programming", "Agile / Scrum", "Git", "GitHub"] },
  { group: "Data analysis", items: ["NumPy", "Pandas", "Matplotlib", "Seaborn"] },
];

export const EDUCATION = [
  {
    school: "Politecnico di Torino",
    degree: "BSc Computer Engineering",
    years: "2024 — Present",
    location: "Torino, Italy",
    current: true,
    notes: [] as string[],
    coursework: ["Python", "C", "Complexity Analysis", "Sorting Algorithms"],
  },
  {
    school: "Celal Bayar University",
    degree: "BSc Software Engineering",
    years: "2022 — 2024",
    location: "Manisa, Türkiye",
    current: false,
    notes: ["GPA 3.62", "Merit-based academic scholarship for high departmental ranking"],
    coursework: ["Python", "C", "Java", "Data Structures", "Object-Oriented Programming"],
  },
];

export const FEATURED_CERT = {
  code: "CLF-C02",
  title: "AWS Certified Cloud Practitioner",
  issuer: "Amazon Web Services",
  topics: AWS_SERVICES,
};

export const CERTS = [
  { title: "Introduction to Software Engineering", issuer: "IBM · Coursera" },
  { title: "Introduction to Agile Development and Scrum", issuer: "IBM · Coursera" },
  { title: "Backend Web Development Path with Beginner Java", issuer: "Patika.dev" },
  { title: "The Complete SQL Bootcamp", issuer: "Udemy" },
  { title: "100 Days of Code: The Complete Python Pro Bootcamp", issuer: "Udemy" },
  { title: "Python for Data Science, AI & Development", issuer: "IBM · Coursera" },
  { title: "Flutter & Dart — The Complete Guide", issuer: "Academind · Udemy" },
  { title: "Introduction to Programming with Java", issuer: "BTK Akademi · 2023" },
  { title: "Mathematics for Machine Learning: Linear Algebra", issuer: "Imperial College London · Coursera" },
];
