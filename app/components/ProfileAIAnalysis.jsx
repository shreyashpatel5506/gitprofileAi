"use client";

import React from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import ReactMarkdown from "react-markdown";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const ProfileAIAnalysis = ({ analysis }) => {
  if (!analysis) return null;

  const { verdict, scores, missing, plan, recruiter } = analysis;
  if (!verdict || !scores) return null;

  const entries = Object.entries(scores);
  const weakest = entries.reduce((a, b) => (a[1] < b[1] ? a : b));

  const resumeScore = Math.round(
    entries.reduce((s, [, v]) => s + v, 0) * 2
  );
  const resumeVerdict =
    resumeScore >= 70 ? "YES" : resumeScore >= 50 ? "MAYBE" : "NO";

  return (
    <div className="space-y-10">

      {/* 🧠 VERDICT */}
      <section className="bg-white rounded-3xl p-8 border">
        <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold">
          {verdict.level}
        </span>
        <p className="mt-4 text-gray-700 font-semibold">
          {verdict.summary}
        </p>
      </section>

      {/* 📊 SCORES */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {entries.map(([k, v]) => (
          <div
            key={k}
            className={`p-4 rounded-xl text-center border ${
              k === weakest[0]
                ? "bg-red-100 border-red-400 text-red-700"
                : "bg-gray-50"
            }`}
          >
            <p className="text-xs uppercase">{k}</p>
            <p className="text-2xl font-black">{v}/10</p>
          </div>
        ))}
      </section>

      {/* 📈 RADAR */}
      <section className="bg-white p-8 rounded-3xl border">
        <Radar
          data={{
            labels: entries.map(([k]) => k),
            datasets: [
              {
                data: entries.map(([, v]) => v),
                fill: true,
                backgroundColor: "rgba(99,102,241,0.25)",
                borderColor: "#6366f1",
              },
            ],
          }}
          options={{
            scales: { r: { min: 0, max: 10 } },
            plugins: { legend: { display: false } },
          }}
        />
      </section>

      <Section title="What is Missing">
        <ReactMarkdown>{missing}</ReactMarkdown>
      </Section>

      <Section title="30-Day Improvement Plan">
        <ReactMarkdown>{plan}</ReactMarkdown>
      </Section>

      {/* 🎯 RESUME */}
      <section
        className={`rounded-3xl p-8 text-white ${
          resumeVerdict === "YES"
            ? "bg-green-600"
            : resumeVerdict === "MAYBE"
            ? "bg-yellow-500"
            : "bg-red-600"
        }`}
      >
        <h3 className="font-black uppercase">Resume Readiness</h3>
        <p className="text-6xl font-black mt-3">{resumeScore}/100</p>
        <ReactMarkdown className="mt-6 prose prose-invert">
          {recruiter}
        </ReactMarkdown>
      </section>
    </div>
  );
};

const Section = ({ title, children }) => (
  <section className="bg-white rounded-3xl p-8 border">
    <h2 className="text-xl font-black mb-4">{title}</h2>
    <div className="prose max-w-none">{children}</div>
  </section>
);

export default ProfileAIAnalysis;
