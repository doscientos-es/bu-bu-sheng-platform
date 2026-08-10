type LoyaltyEmailInput = {
  customerName: string;
  email: string;
  rewardCode: string;
  rewardDescription: string;
  rewardName: string;
  expiresAt: string;
};

export type LoyaltyEmailResult = {
  providerMessageId: string | null;
  status: "prepared" | "sent";
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] ?? character;
  });
}

function emailMarkup(input: LoyaltyEmailInput) {
  const firstName = escapeHtml(input.customerName.split(" ")[0] || input.customerName);
  return `<h1>Tenemos una recompensa para ti, ${firstName}</h1>
<p>${escapeHtml(input.rewardDescription)}</p>
<p><strong>${escapeHtml(input.rewardName)}</strong></p>
<p>Código: <strong>${escapeHtml(input.rewardCode)}</strong></p>
<p>Disponible hasta el ${escapeHtml(input.expiresAt)}.</p>
<p>Recibes este email porque aceptaste comunicaciones comerciales. Puedes solicitar la baja en tu cafetería.</p>`;
}

export async function sendLoyaltyEmail(input: LoyaltyEmailInput): Promise<LoyaltyEmailResult> {
  const canSend =
    process.env.EMAIL_SEND_ENABLED === "true" && process.env.EMAIL_PROVIDER === "resend";
  const from = process.env.EMAIL_FROM;
  const apiKey = process.env.RESEND_API_KEY;

  if (!canSend || !from || !apiKey || from.startsWith("TODO_")) {
    return { providerMessageId: null, status: "prepared" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      reply_to: process.env.EMAIL_REPLY_TO || undefined,
      subject: `Tienes una recompensa: ${input.rewardName}`,
      html: emailMarkup(input),
    }),
  });

  if (!response.ok) throw new Error("El proveedor de email no ha aceptado el envío.");

  const responseBody: unknown = await response.json();
  const providerMessageId =
    typeof responseBody === "object" && responseBody !== null && "id" in responseBody
      ? String(responseBody.id)
      : null;

  return { providerMessageId, status: "sent" };
}
