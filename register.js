exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed." })
    };
  }

  try {
    const { email } = JSON.parse(event.body || "{}");

    if (
      typeof email !== "string" ||
      email.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Invalid email address." })
      };
    }

    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.NOVA_ADMIN_EMAIL;
    const fromEmail = process.env.NOVA_FROM_EMAIL;

    if (!apiKey || !adminEmail || !fromEmail) {
      throw new Error("Email configuration is incomplete.");
    }

    const applicantEmail = email.trim();

    const sendEmail = async (to, subject, html) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Resend error:", result);
        throw new Error("Email delivery failed.");
      }

      return result;
    };

    // Notify NOVA administrator
    await sendEmail(
      adminEmail,
      "New NOVA Alpha Tester Application",
      `
      <div style="background:#080b11;color:white;padding:35px;font-family:Arial">
        <h1 style="color:#ed405f">NOVA</h1>
        <h2>NEW APPLICATION RECEIVED</h2>
        <p>A new player has submitted an Alpha Tester application.</p>
        <p><strong>Applicant email:</strong> ${applicantEmail.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        <p style="color:#aaa">Status: PENDING REVIEW</p>
      </div>
      `
    );

    // Confirmation email for applicant
    await sendEmail(
      applicantEmail,
      "NOVA | Application Received",
      `
      <div style="background:#080b11;color:white;padding:35px;font-family:Arial;text-align:center">
        <h1 style="letter-spacing:8px;color:#ed405f">NOVA</h1>
        <p style="letter-spacing:3px;color:#aaa">RULES OF SURVIVAL</p>
        <div style="border:1px solid #e83c5b;padding:30px;margin-top:25px">
          <h2 style="font-size:25px">APPLICATION RECEIVED</h2>
          <p style="color:#ff8295;font-weight:bold">PENDING REVIEW</p>
          <p style="color:#bbb;line-height:1.8">
            Thank you for applying to the NOVA Alpha Tester Program.
            Your application has been received and is awaiting review
            by our development team.
          </p>
          <p style="color:#bbb">Please monitor your inbox for future updates.</p>
        </div>
        <p style="color:#777;font-size:11px;margin-top:25px">
          NOVA PROJECT · INDEPENDENT FAN-MADE PROJECT
        </p>
      </div>
      `
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Application received. Confirmation email sent."
      })
    };

  } catch (error) {
    console.error("NOVA registration error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Unable to process your application. Please try again later."
      })
    };
  }
};