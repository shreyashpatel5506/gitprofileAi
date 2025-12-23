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

const LABELS = {
  consistency: "Consistency",
  projectQuality: "Project Quality",
  openSource: "Open Source",
  documentation: "Documentation",
  branding: "Personal Branding",
  hiringReadiness: "Hiring Readiness",
};

const ProfileAIAnalysis = ({ analysis }) => {
  if (!analysis) return null;

  const { verdict, scores, missing, plan, recruiter } = analysis;
  if (!verdict || !scores) return null;

  const entries = Object.entries(scores);
  const weakest = entries.reduce((a, b) => (a[1] < b[1] ? a : b));

  const resumeScore = Math.round(
    (entries.reduce((s, [, v]) => s + v, 0) / 60) * 100
  );

  const resumeVerdict =
    resumeScore >= 70 ? "YES" : resumeScore >= 50 ? "MAYBE" : "NO";

  return (
    <div className="space-y-12">

      {/* ================= HERO VERDICT ================= */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-500 text-white rounded-3xl p-10">
        <span className="inline-block bg-black/20 px-4 py-1 rounded-full text-sm font-bold">
          Level: {verdict.level}
        </span>
        <p className="mt-6 text-lg font-medium leading-relaxed max-w-3xl">
          {verdict.summary}
        </p>
      </section>

      {/* ================= SIGNAL SCORES ================= */}
      <section>
        <h2 className="text-xl font-black mb-4">Profile Health Signals</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {entries.map(([k, v]) => {
            const isWeakest = k === weakest[0];
            return (
              <div
                key={k}
                className={`p-5 rounded-2xl border text-center transition ${
                  isWeakest
                    ? "bg-red-50 border-red-400 text-red-700"
                    : "bg-white"
                }`}
              >
                <p className="text-xs uppercase tracking-wide opacity-70">
                  {LABELS[k]}
                </p>
                <p className="text-3xl font-black mt-1">{v}/10</p>
                {isWeakest && (
                  <p className="mt-2 text-xs font-semibold">
                    ⚠ Primary Weakness
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= RADAR ================= */}
      <section className="bg-white p-8 rounded-3xl border">
        <h2 className="text-xl font-black mb-6">Skill Distribution Overview</h2>
        <Radar
          data={{
            labels: entries.map(([k]) => LABELS[k]),
            datasets: [
              {
                data: entries.map(([, v]) => v),
                fill: true,
                backgroundColor: "rgba(99,102,241,0.25)",
                borderColor: "#6366f1",
                pointBackgroundColor: "#6366f1",
              },
            ],
          }}
          options={{
            scales: {
              r: {
                min: 0,
                max: 10,
                ticks: { stepSize: 2 },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: { enabled: true },
            },
          }}
        />
      </section>

      {/* ================= GAPS ================= */}
      <Section title="What Is Missing (Critical Gaps)">
        <ReactMarkdown>{missing}</ReactMarkdown>
      </Section>

      {/* ================= PLAN ================= */}
      <Section title="30-Day Improvement Plan">
        <ReactMarkdown>{plan}</ReactMarkdown>
      </Section>

      {/* ================= RECRUITER DECISION ================= */}
      <section
        className={`rounded-3xl p-10 text-white ${
          resumeVerdict === "YES"
            ? "bg-green-600"
            : resumeVerdict === "MAYBE"
            ? "bg-yellow-500"
            : "bg-red-600"
        }`}
      >
        <h3 className="font-black uppercase tracking-wide">
          Recruiter Hiring Signal
        </h3>
        <p className="text-6xl font-black mt-4">{resumeScore}/100</p>
        <p className="mt-2 text-lg font-semibold">
          Shortlist Decision: {resumeVerdict}
        </p>

        <div className="mt-6 prose prose-invert max-w-none">
          <ReactMarkdown>{recruiter}</ReactMarkdown>
        </div>
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
