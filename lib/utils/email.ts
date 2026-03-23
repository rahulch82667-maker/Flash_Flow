import nodemailer from "nodemailer";

export const sendRefundEmail = async (userEmail: string, orderId: string, status: string, amount: number) => {
  if (!process.env.EMAIL_USER && process.env.NODE_ENV !== "development") {
    console.warn("EMAIL_USER not set, skipping email sending");
    return;
  }

  // Fallback to ethereal email for dev if needed or just skip.
  if (!process.env.EMAIL_USER) return;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_USER,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    from: `"Flash Flow" <${process.env.SMTP_FROM || "noreply@flashflow.com"}>`,
    to: userEmail,
    subject: `Refund Update for Order #${orderId}`,
    html: `
      <h2>Refund Status Update</h2>
      <p>Hello,</p>
      <p>Your refund for order <strong>#${orderId}</strong> is now <strong>${status}</strong>.</p>
      ${amount ? `<p>Refund Amount: ₹${amount.toLocaleString()}</p>` : ''}
      <p>Thank you for shopping with Flash Flow!</p>
    `,
  };

  try {
    await transporter.sendMail(message);
    console.log(`Refund email sent to ${userEmail} for order ${orderId}`);
  } catch (error) {
    console.error("Error sending refund email:", error);
  }
};
