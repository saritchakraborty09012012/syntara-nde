import { Nav } from "./components/Nav"
import { Hero } from "./components/Hero"
import { Showcase } from "./components/Showcase"
import { Install } from "./components/Install"
import { Why } from "./components/Why"
import { Architecture } from "./components/Architecture"
import { Models } from "./components/Models"
import { Agents, Developers } from "./components/AgentsDev"
import { Requirements, OpenSource } from "./components/RequirementsOpen"
import { Faq } from "./components/Faq"
import { Roadmap } from "./components/Roadmap"
import { Footer } from "./components/Footer"

export default function App() {
  return (
    <div className="min-h-screen text-ink">
      <Nav />
      <main>
        <Hero />
        <Showcase />
        <Install />
        <Why />
        <Architecture />
        <Models />
        <Agents />
        <Developers />
        <Requirements />
        <OpenSource />
        <Faq />
        <Roadmap />
      </main>
      <Footer />
    </div>
  )
}
