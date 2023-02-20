import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import CrosswordRoute from "./CrosswordRoute";
import Home from "./Home";

function App() {
  return (
    <div>
      <p>my app</p>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="cw" element={<CrosswordRoute />} />
      </Routes>
    </div>
  );
}

export default App;
