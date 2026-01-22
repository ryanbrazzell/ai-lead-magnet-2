import fs from "fs";

const email = "ryan@assistantlaunch.com";
const firstName = "Ryan";
const lastName = "Brazzell";
const revenueRange = "$1M to $3M";
const painPoints = "I have a family, and I'm having a hard time balancing my family life. My invoicing process is super messed up.";

interface TaskData {
  isEA?: boolean;
  owner?: string;
}

async function testAndSendEmail() {
  console.log("=== GENERATING & SENDING PDF EMAIL ===\n");

  // Step 1: Generate tasks with Claude Sonnet 4.5
  console.log("1. Generating tasks with Claude Sonnet 4.5...");
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
  const weeklyEA = taskData.data.tasks.weekly.filter((t: TaskData) => t.isEA || t.owner?.toLowerCase() === "ea").length;
  const weeklyFounder = taskData.data.tasks.weekly.filter((t: TaskData) => !t.isEA && t.owner?.toLowerCase() !== "ea").length;
  const monthlyEA = taskData.data.tasks.monthly.filter((t: TaskData) => t.isEA || t.owner?.toLowerCase() === "ea").length;
  const monthlyFounder = taskData.data.tasks.monthly.filter((t: TaskData) => !t.isEA && t.owner?.toLowerCase() !== "ea").length;

  console.log("✓ Tasks generated:", taskData.data.total_task_count, "tasks");
  console.log("  Daily:   " + dailyEA + " EA, " + dailyFounder + " Founder");
  console.log("  Weekly:  " + weeklyEA + " EA, " + weeklyFounder + " Founder");
  console.log("  Monthly: " + monthlyEA + " EA, " + monthlyFounder + " Founder\n");

  // Step 2: Generate PDF
  console.log("2. Generating PDF with updated layout...");
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
  const outputPath = "/Users/ryanbrazzell/boundless-os-template-2/web/test-output-ryan.pdf";
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log("3. PDF saved locally to:", outputPath);

  // Step 3: Send email via Resend
  console.log("\n4. Sending email to", email, "via Resend...");
  const emailRes = await fetch("http://localhost:3000/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: email,
      firstName,
      lastName,
      pdfBuffer: pdfData.pdf, // base64 PDF
    })
  });
  const emailData = await emailRes.json();
  if (!emailData.success) {
    console.error("Email sending failed:", emailData.error);
    return;
  }
  console.log("✓ Email sent successfully!");
  console.log("  Message ID:", emailData.messageId);

  console.log("\n=== COMPLETE ===");
  console.log("Check your inbox at", email);
  console.log("Also check the local PDF at:", outputPath);
}

testAndSendEmail().catch(console.error);
