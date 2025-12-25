// app/api/tech-stack/route.js
import { fetchUserTechStack } from "@/app/lib/githubTechStack";
import { convertToPercentage } from "@/app/lib/convertToPercentage";
import jsPDF from "jspdf";

export async function POST(req) {
  try {
    const { username, format } = await req.json();

    if (!username) {
      return Response.json({ error: "Username required" }, { status: 400 });
    }

    // 1️⃣ Fetch tech stack
    const techBytes = await fetchUserTechStack(username);
    const techPercentage = convertToPercentage(techBytes);

    // 2️⃣ If PDF requested
    if (format === "pdf") {
      const pdf = new jsPDF();

      pdf.setFontSize(18);
      pdf.text("GitHub Tech Stack Analysis", 20, 20);

      pdf.setFontSize(12);
      pdf.text(`Username: ${username}`, 20, 32);

      let y = 50;
      Object.entries(techPercentage).forEach(([tech, value]) => {
        pdf.text(`${tech}: ${value}%`, 20, y);
        y += 8;
      });

      const pdfBuffer = pdf.output("arraybuffer");

      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=${username}-tech-stack.pdf`,
        },
      });
    }

    // 3️⃣ Normal JSON response
    return Response.json({
      success: true,
      techStack: techPercentage,
    });

  } catch (err) {
    console.error("Tech stack error:", err);
    return Response.json(
      { error: "Failed to fetch tech stack" },
      { status: 500 }
    );
  }
}
