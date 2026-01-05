import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Welcome to PlateMate</h1>

      <div className="flex gap-8 mb-8">
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="h-24 p-4 hover:drop-shadow-[0_0_2em_#747bff] transition-all" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="h-24 p-4 hover:drop-shadow-[0_0_2em_#24c8db] transition-all" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="h-24 p-4 hover:drop-shadow-[0_0_2em_#61dafb] transition-all" alt="React logo" />
        </a>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Greet
        </button>
      </form>
      <p className="mt-4 text-lg font-medium text-gray-700">{greetMsg}</p>
    </main>
  );
}

export default App;