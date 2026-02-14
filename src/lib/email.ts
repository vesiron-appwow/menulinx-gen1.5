// src/lib/email.ts

type EmailOrder = {
  orderId: string;
  venueId: string;
  createdAt: string;
  estimatedReadyAt: string;
  customerName: string;
  customerContact: string;
  customerNote?: string;
  items: Array<{ name: string; qty: number }>;
};

export async function sendOrderEmail(
  env: any,
  toEmail: string,
  order: EmailOrder
): Promise<void> {
  try {
    const lines = order.items
      .map(i => `• ${i.qty} × ${i.name}`)
      .join("\n");

    const body = `
New MenuLinx Order

Order ID: ${order.orderId}
Time: ${new Date(order.createdAt).toLocaleString()}
Estimated Ready: ${new Date(order.estimatedReadyAt).toLocaleTimeString()}

Customer:
${order.customerName}
${order.customerContact}

Notes:
${order.customerNote || "—"}

Items:
${lines}

This email is informational only.
MenuLinx Admin is the source of truth.
`;

    await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: toEmail }] }],
        from: {
          email: "no-reply@menulinx.app",
          name: "MenuLinx"
        },
        subject: `New Order ${order.orderId}`,
        content: [{ type: "text/plain", value: body }]
      })
    });
  } catch {
    // Fire-and-forget: swallow all errors
  }
}
