"use client";

import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [username, setUsername] = useState("");

  return (
    <div className="flex justify-center gap-2">
      <input
        className="px-4 py-2 rounded text-black"
        placeholder="GitHub username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button
  disabled={loading}
  className="disabled:opacity-50 disabled:cursor-not-allowed"
>
  Generate Profile
</button>

        Analyze
      </button>
    </div>
  );
}
