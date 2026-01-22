import fs from "fs";

const email = "ryan@assistantlaunch.com";
const firstName = "Ryan";
const lastName = "Test";
const revenueRange = "$500k to $1M";
const painPoints = "Email inbox chaos, calendar scheduling, client follow-ups";

interface TaskData {
  isEA?: boolean;
  owner?: string;
}

async function testPDFGeneration() {
  console.log("=== TESTING PDF GENERATION ===\n");

  // Step 1: Generate tasks
  console.log("1. Generating tasks...");
  const taskRes = await fetch("http://localhost:3000/api/generate-tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leadType: "main",
      firstName,
      lastName,
      email,
      revenueRange,
      painPoints
    })
  });
  const taskData = await taskRes.json();
  if (!taskData.success) {
    console.error("Task generation failed:", taskData.error);
    return;
  }

  // Count EA vs Founder tasks
  const dailyEA = taskData.data.tasks.daily.filter((t: TaskData) => t.isEA || t.owner?.toLowerCase() === "ea").length;
  const dailyFounder = taskData.data.tasks.daily.filter((t: TaskData) => !t.isEA && t.owner?.toLowerCase() !== "ea").length;
  console.log("✓ Tasks generated:", taskData.data.total_task_count, "tasks");
  console.log("  Daily: " + dailyEA + " EA, " + dailyFounder + " Founder\n");

  // Step 2: Generate PDF
  console.log("2. Generating PDF...");
  const pdfRes = await fetch("http://localhost:3000/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tasks: taskData.data.tasks,
      eaPercentage: taskData.data.ea_task_percent,
      userData: { firstName, lastName, email },
      revenueRange
    })
  });
  const pdfData = await pdfRes.json();
  if (!pdfData.success) {
    console.error("PDF generation failed:", pdfData.error);
    return;
  }
  console.log("✓ PDF generated:", Math.round(pdfData.pdf.length / 1024), "KB\n");

  // Save PDF locally for inspection
  const pdfBuffer = Buffer.from(pdfData.pdf, "base64");
  const outputPath = "/Users/ryanbrazzell/boundless-os-template-2/web/test-output.pdf";
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log("3. PDF saved to:", outputPath);
  console.log("\n=== TEST COMPLETE ===");
  console.log("Open the PDF to verify the new layout.");
}

testPDFGeneration().catch(console.error);
