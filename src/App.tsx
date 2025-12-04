import { LocalServices } from "./sections/LocalServices";
import { WorldClocks } from "./sections/WorldClocks";
import Weather from "./sections/Weather";
import { AIServices } from "./sections/AIServices";
import { SystemStats } from "./sections/SystemStats";

function App() {
  return (
    <div className="max-w-[860px] mx-auto bg-[var(--color-bg)] p-4 transition-all duration-200 font-['Literata',serif]">
      <header className="w-full mb-2 md:mb-0">
        <h1 className="text-4xl font-bold mx-auto text-center italic">
          paxboard
        </h1>
      </header>
      <main className="space-y-4">
        <LocalServices />
        <WorldClocks />
        <Weather />
        <SystemStats />
        <AIServices />
      </main>
    </div>
  );
}

export default App;
