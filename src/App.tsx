import { LocalServices } from "./components/LocalServices";
import { AIServices } from "./components/AIServices";

function App() {
  return (
    <div className="max-w-[860px] mx-auto bg-[var(--color-bg)] p-4 transition-all duration-200 font-['Literata',serif]">
      <header className="w-full">
        <h1 className="text-3xl font-bold mx-auto text-center border-b border-white border-dotted pb-4 italic">
          paxboard
        </h1>
      </header>
      <main className="mt-4 space-y-8">
        <LocalServices />
        <AIServices />
      </main>
    </div>
  );
}

export default App;
