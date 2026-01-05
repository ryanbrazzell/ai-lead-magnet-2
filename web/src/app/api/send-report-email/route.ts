/**
 * Send Report Email API
 * Uses Resend to send the Time Freedom Report PDF to the user
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

/** Initialize Resend client lazily to avoid build errors */
let resend: Resend | null = null;
function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');
  }
  return resend;
}

interface SendReportEmailRequest {
  email: string;
  firstName: string;
  lastName?: string;
  pdfBase64: string;
  revenueUnlocked: number;
  weeklyHoursSaved: number;
  roiMultiplier: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendReportEmailRequest = await request.json();
    const {
      email,
      firstName,
      lastName = "",
      pdfBase64,
      revenueUnlocked,
      weeklyHoursSaved,
      roiMultiplier,
    } = body;

    if (!email || !pdfBase64) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Format currency for email
    const formattedRevenue = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(revenueUnlocked);

    // Create the email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your EA Time Freedom Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 10px 0; font-weight: 700;">
                Your Time Freedom Report
              </h1>
              <p style="color: #bfdbfe; font-size: 16px; margin: 0;">
                ${firstName}, here's your personalized EA ROI analysis
              </p>
            </td>
          </tr>

          <!-- Hero Stats -->
          <tr>
            <td style="padding: 30px; background-color: #fefce8; border-bottom: 1px solid #fef08a;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="color: #854d0e; font-size: 14px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">
                      You could be earning an extra
                    </p>
                    <p style="color: #d97706; font-size: 42px; font-weight: 800; margin: 0;">
                      ${formattedRevenue}/year
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Stats Row -->
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="text-align: center; padding: 15px; background-color: #eff6ff; border-radius: 8px;">
                    <p style="color: #1e40af; font-size: 32px; font-weight: 700; margin: 0;">
                      ${weeklyHoursSaved}+
                    </p>
                    <p style="color: #3b82f6; font-size: 14px; margin: 5px 0 0 0;">
                      hours/week freed
                    </p>
                  </td>
                  <td width="10"></td>
                  <td width="50%" style="text-align: center; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                    <p style="color: #92400e; font-size: 32px; font-weight: 700; margin: 0;">
                      ${roiMultiplier.toFixed(1)}x
                    </p>
                    <p style="color: #d97706; font-size: 14px; margin: 5px 0 0 0;">
                      ROI on EA investment
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PDF Download Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; padding: 25px; border: 1px solid #e2e8f0;">
                <tr>
                  <td>
                    <p style="color: #0f172a; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">
                      Your Full Report is Attached
                    </p>
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 15px 0; line-height: 1.6;">
                      We've attached your complete EA Time Freedom Report as a PDF. It includes:
                    </p>
                    <ul style="color: #475569; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                      <li>Task-by-task breakdown by frequency (daily, weekly, monthly)</li>
                      <li>Which tasks can be delegated to an EA</li>
                      <li>Annual cost of each task at your hourly rate</li>
                      <li>Complete ROI analysis</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Ready to reclaim your time?
              </p>
              <a href="https://assistantlaunch.com" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Book Your Discovery Call
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 25px 30px; text-align: center;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px 0;">
                Assistant Launch | Time Freedom Starts Here
              </p>
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                Questions? Text us at (619) 952-4992
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email with Resend
    const { data, error } = await getResendClient().emails.send({
      from: "Ryan at Assistant Launch <ryan@assistantlaunch.com>",
      to: email,
      subject: `${firstName}, Your EA Time Freedom Report is Ready`,
      html: emailHtml,
      attachments: [
        {
          filename: `EA-Time-Freedom-Report-${firstName}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    });
  } catch (error) {
    console.error("Send report email error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
