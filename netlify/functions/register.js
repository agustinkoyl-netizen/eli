

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Method not allowed."
      })
    };
  }

  try {
    const { email } = JSON.parse(event.body || "{}");

    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: "Please enter a valid email address."
        })
      };
    }

    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.NOVA_ADMIN_EMAIL;
    const fromEmail = process.env.NOVA_FROM_EMAIL;

    if (!apiKey || !adminEmail || !fromEmail) {
      throw new Error("Email configuration is incomplete.");
    }

    const sendEmail = async (payload) => {
      const response = await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Resend error:", result);
        throw new Error("Email delivery request failed.");
      }

      return result;
    };

    const applicantEmail = email.trim();

    // Notify NOVA administrator
    await sendEmail({
      from: fromEmail,
      to: [adminEmail],
      subject: "NOVA — New Alpha Tester Application",
      html: `
        <div style="font-family:Arial,sans-serif;background:#10131d;color:#fff;padding:30px;">
          <h1 style="color:#e53935;">NOVA</h1>
          <h2>New Alpha Tester Application</h2>
          <p>A new player has submitted an application.</p>
          <p><strong>Applicant email:</strong> ${applicantEmail.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          <p>Status: Pending Review</p>
        </div>
      `
    });

    // Confirmation for applicant
    await sendEmail({
      from: fromEmail,
      to: [applicantEmail],
      subject: "NOVA — Application Received",
      html: `
        <div style="font-family:Arial,sans-serif;background:#10131d;color:#fff;text-align:center;padding:40px 20px;">
          <h1 style="color:#e53935;letter-spacing:5px;">NOVA</h1>
          <h2>APPLICATION RECEIVED</h2>
          <p style="color:#bbb;">Your Alpha Tester application has been received.</p>
          <div style="display:inline-block;border:1px solid #e53935;padding:12px 25px;margin:20px 0;">
            <strong style="color:#ff5555;">PENDING REVIEW</strong>
          </div>
          <p style="color:#aaa;">Our team will review your application.</p>
          <p style="color:#666;font-size:12px;">NOVA: RULES OF SURVIVAL — Independent fan-made project.</p>
        </div>
      `
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Application received successfully."
      })
    };

  } catch (error) {
    console.error("NOVA registration error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Unable to submit application. Please try again later."
      })
    };
  }
};
