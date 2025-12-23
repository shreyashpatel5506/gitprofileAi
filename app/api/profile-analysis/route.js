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
You are a Senior Open Source Maintainer, Tech Recruiter, and Career Mentor.
You are known for being brutally honest but highly practical.

Analyze a COMPLETE GitHub PROFILE (not a single repository).

Your goal:
- Evaluate this profile exactly how a recruiter would
- Clearly explain why it succeeds or fails
- Focus heavily on HOW TO IMPROVE this profile in a realistic way

Avoid generic advice.
Every suggestion must be actionable and specific.

Return MARKDOWN in the EXACT structure below.
Do NOT add extra headings.
Do NOT rename any section.
Do NOT include emojis.

---

## Overall Verdict
Give a concise, honest summary of this GitHub profile.
Mention:
- How this profile looks in a 30-second recruiter scan
- The biggest strength and biggest weakness
- Level: (Beginner / Junior / Intermediate / Strong / Hire-Ready)

## Health Scores (0–10)
Consistency:
Project Quality:
Open Source:
Documentation:
Personal Branding:
Hiring Readiness:

(Score realistically based on industry expectations, not encouragement.)

## What Is Missing
List the most critical gaps holding this profile back.
Focus on:
- Weak signals
- Red flags
- Missing recruiter signals

Use bullet points.

## 30-Day Improvement Plan
Provide a realistic, week-by-week improvement plan.
Include:
- Exact GitHub actions (commits, PRs, issues, README upgrades)
- Open-source contribution strategy (what type of repos & issues)
- How to visibly improve this profile within 30 days

This plan should be achievable alongside a job or college schedule.

## Recruiter Perspective
Answer honestly:
- Would you shortlist this profile today?
- For what type of role (if any)?
- What ONE change would most increase hiring chances?

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
      `- ${r.name}: ⭐ ${r.stars}, 🍴 ${r.forks}, ${r.description || "No description"}`
  )
  .join("\n")}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.35,
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
      raw: analysisText,
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
