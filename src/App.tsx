import React from "react";
import { Routes, Route } from "react-router-dom";
import Admin from "./Admin";
import "./App.css";
import CrosswordRoute from "./CrosswordRoute";
import Home from "./Home";

function App() {
  return (
    <div>
      <h1>Nostr-Crossword</h1>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="cw" element={<CrosswordRoute />} />
        <Route path="admin" element={<Admin />} />
      </Routes>
    </div>
  );
}

export default App;
