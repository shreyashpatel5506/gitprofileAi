import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { profile, repos, pullRequests, recentActivity } = await req.json();

    if (!profile || !repos) {
      return NextResponse.json(
        { error: "Invalid profile data" },
        { status: 400 }
      );
    }

    const prompt = `
You are a brutally honest Senior Open Source Maintainer and Tech Recruiter.

Analyze this GitHub PROFILE (not a single repo).

Return MARKDOWN in EXACT structure below.

Do NOT add extra headings.

---

## Overall Verdict
Give a short brutal summary.
Also include:
Level: (Beginner / Junior / Intermediate / Strong / Hire-Ready)

## Health Scores (0–10)
Consistency:
Project Quality:
Open Source:
Documentation:
Personal Branding:
Hiring Readiness:

## What Is Missing
Bullet list.

## 30-Day Improvement Plan
Actionable steps.

## Recruiter Perspective
Would you shortlist this profile? Why / why not?

---

GitHub Profile Data:
Username: ${profile.username}
Followers: ${profile.followers}
Following: ${profile.following}
Public Repos: ${profile.publicRepos}

Pull Requests:
Open: ${pullRequests?.open || 0}
Merged: ${pullRequests?.merged || 0}

Recent Activity:
Commits: ${recentActivity?.commits || 0}
Active Repos: ${recentActivity?.activeRepositories || 0}

Repositories Summary:
${repos
  .slice(0, 10)
  .map(
    (r) =>
      `- ${r.name}: ⭐ ${r.stars}, 🍴 ${r.forks}, ${r.description || "No desc"}`
  )
  .join("\n")}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const analysisText = completion.choices[0].message.content;

    /* ------------------ HELPERS ------------------ */

    const extractSection = (title) => {
      const regex = new RegExp(`## ${title}[\\s\\S]*?(?=##|$)`, "i");
      const match = analysisText.match(regex);
      return match
        ? match[0].replace(`## ${title}`, "").trim()
        : "";
    };

    const nums =
      analysisText.match(/\b([0-9]|10)\b/g)?.map(Number) || [];

    const scores = {
      consistency: nums[0] ?? 0,
      projectQuality: nums[1] ?? 0,
      openSource: nums[2] ?? 0,
      documentation: nums[3] ?? 0,
      branding: nums[4] ?? 0,
      hiringReadiness: nums[5] ?? 0,
    };

    const verdictRaw = extractSection("Overall Verdict");

    const levelMatch = verdictRaw.match(
      /(Beginner|Junior|Intermediate|Strong|Hire-Ready)/i
    );

    const analysis = {
      verdict: {
        level: levelMatch?.[0] || "Unknown",
        summary: verdictRaw,
      },
      scores,
      missing: extractSection("What Is Missing"),
      plan: extractSection("30-Day Improvement Plan"),
      recruiter: extractSection("Recruiter Perspective"),
      raw: analysisText, // optional (debug / dev)
    };

    return NextResponse.json({ analysis });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Profile AI analysis failed", details: err.message },
      { status: 500 }
    );
  }
}
