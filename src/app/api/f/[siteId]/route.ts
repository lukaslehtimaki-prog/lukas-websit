import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { isResendConfigured } from "@/lib/env";
import type { SiteContent } from "@/lib/templates/types";

// Public form endpoint for published sites: contact + booking forms POST here
// (no JavaScript required on the generated site). The message is stored in the
// workspace's inbox and forwarded by email to the business, then the visitor
// sees a localized confirmation page.

export const dynamic = "force-dynamic";

type FormStrings = {
  sentTitle: string;
  sentBody: string;
  back: string;
  fwdSubject: string; // {name} placeholder
  fwdIntro: string;
  replyHint: string;
};

const STRINGS: Record<string, FormStrings> = {
  en: {
    sentTitle: "Message sent",
    sentBody: "Thank you! Your message has been delivered — you'll hear back soon.",
    back: "Back to the website",
    fwdSubject: "New message from your website — {name}",
    fwdIntro: "You received a new message through your website:",
    replyHint: "Reply to this email to answer directly.",
  },
  fi: {
    sentTitle: "Viesti lähetetty",
    sentBody: "Kiitos! Viestisi on toimitettu — sinuun ollaan pian yhteydessä.",
    back: "Takaisin sivustolle",
    fwdSubject: "Uusi viesti verkkosivuiltasi — {name}",
    fwdIntro: "Sait uuden viestin verkkosivujesi kautta:",
    replyHint: "Vastaa tähän sähköpostiin vastataksesi suoraan.",
  },
  sv: {
    sentTitle: "Meddelandet skickat",
    sentBody: "Tack! Ditt meddelande har levererats — du hör av oss snart.",
    back: "Tillbaka till webbplatsen",
    fwdSubject: "Nytt meddelande från din webbplats — {name}",
    fwdIntro: "Du har fått ett nytt meddelande via din webbplats:",
    replyHint: "Svara på det här mejlet för att svara direkt.",
  },
  de: {
    sentTitle: "Nachricht gesendet",
    sentBody: "Vielen Dank! Ihre Nachricht wurde zugestellt — Sie hören bald von uns.",
    back: "Zurück zur Website",
    fwdSubject: "Neue Nachricht von Ihrer Website — {name}",
    fwdIntro: "Sie haben eine neue Nachricht über Ihre Website erhalten:",
    replyHint: "Antworten Sie auf diese E-Mail, um direkt zu antworten.",
  },
  fr: {
    sentTitle: "Message envoyé",
    sentBody: "Merci ! Votre message a bien été transmis — vous aurez bientôt une réponse.",
    back: "Retour au site",
    fwdSubject: "Nouveau message depuis votre site — {name}",
    fwdIntro: "Vous avez reçu un nouveau message via votre site web :",
    replyHint: "Répondez à cet e-mail pour répondre directement.",
  },
  es: {
    sentTitle: "Mensaje enviado",
    sentBody: "¡Gracias! Su mensaje ha sido entregado — pronto recibirá respuesta.",
    back: "Volver al sitio web",
    fwdSubject: "Nuevo mensaje desde su página web — {name}",
    fwdIntro: "Ha recibido un nuevo mensaje a través de su página web:",
    replyHint: "Responda a este correo para contestar directamente.",
  },
  it: {
    sentTitle: "Messaggio inviato",
    sentBody: "Grazie! Il messaggio è stato consegnato — riceverete presto una risposta.",
    back: "Torna al sito",
    fwdSubject: "Nuovo messaggio dal vostro sito — {name}",
    fwdIntro: "Avete ricevuto un nuovo messaggio tramite il vostro sito web:",
    replyHint: "Rispondete a questa email per rispondere direttamente.",
  },
  pt: {
    sentTitle: "Mensagem enviada",
    sentBody: "Obrigado! A sua mensagem foi entregue — em breve terá resposta.",
    back: "Voltar ao site",
    fwdSubject: "Nova mensagem do seu site — {name}",
    fwdIntro: "Recebeu uma nova mensagem através do seu site:",
    replyHint: "Responda a este e-mail para responder diretamente.",
  },
  nl: {
    sentTitle: "Bericht verzonden",
    sentBody: "Bedankt! Uw bericht is afgeleverd — u hoort snel van ons.",
    back: "Terug naar de website",
    fwdSubject: "Nieuw bericht via uw website — {name}",
    fwdIntro: "U heeft een nieuw bericht ontvangen via uw website:",
    replyHint: "Beantwoord deze e-mail om direct te reageren.",
  },
  zh: {
    sentTitle: "消息已发送",
    sentBody: "谢谢！您的消息已送达——很快会有人回复您。",
    back: "返回网站",
    fwdSubject: "来自您网站的新消息——{name}",
    fwdIntro: "您通过网站收到了一条新消息：",
    replyHint: "直接回复此邮件即可回复对方。",
  },
};

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function confirmationPage(s: FormStrings, backUrl: string, lang: string) {
  return `<!DOCTYPE html>
<html lang="${esc(lang)}"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" /><title>${esc(s.sentTitle)}</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#fafafa;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="text-align:center;padding:48px 24px;max-width:420px;">
<div style="width:56px;height:56px;margin:0 auto 20px;border-radius:50%;background:#059669;display:grid;place-items:center;color:#fff;font-size:28px;">✓</div>
<h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">${esc(s.sentTitle)}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#71717a;">${esc(s.sentBody)}</p>
<a href="${esc(backUrl)}" style="display:inline-block;padding:11px 24px;border-radius:10px;background:#18181b;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">${esc(s.back)}</a>
</div></body></html>`;
}

function field(v: FormDataEntryValue | null, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, max);
  return s || null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const form = await req.formData().catch(() => null);
  if (!form) return new Response("Bad request", { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("sites")
    .select("content, tenant_id, status")
    .eq("id", siteId)
    .maybeSingle();
  const site = data as
    | { content: SiteContent; tenant_id: string; status: string }
    | null;
  if (!site || site.status !== "published") {
    return new Response("Not found", { status: 404 });
  }

  const content = site.content;
  const lang = (content.language ?? "fi").toLowerCase();
  const s = STRINGS[lang] ?? STRINGS.en;
  const backUrl = `/s/${siteId}`;
  const done = () =>
    new Response(confirmationPage(s, backUrl, lang), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });

  // Honeypot: real visitors never see or fill this field — silently accept.
  if (field(form.get("company"), 100)) return done();

  const kind = form.get("kind") === "booking" ? "booking" : "contact";
  const name = field(form.get("name"), 200);
  const email = field(form.get("email"), 200);
  const phone = field(form.get("phone"), 60);
  const service = field(form.get("service"), 200);
  const preferredTime = field(form.get("preferred_time"), 200);
  const message = field(form.get("message"), 5000);
  if (!name || (kind === "contact" && !message)) {
    return new Response("Missing required fields", { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response("Invalid email", { status: 400 });
  }

  // Forward to the business by email (reply-to goes to the visitor).
  const businessEmail = content.contact?.email ?? content.source?.email ?? null;
  let forwarded = false;
  if (businessEmail && isResendConfigured()) {
    const lines = [
      s.fwdIntro,
      "",
      ...(service ? [`• ${service}`] : []),
      `• ${name}`,
      ...(email ? [`• ${email}`] : []),
      ...(phone ? [`• ${phone}`] : []),
      ...(preferredTime ? [`• ${preferredTime}`] : []),
      ...(message ? ["", message] : []),
      "",
      ...(email ? [s.replyHint] : []),
    ];
    const r = await sendEmail({
      to: businessEmail,
      subject: s.fwdSubject.replace("{name}", name),
      text: lines.join("\n"),
      replyTo: email ?? undefined,
    });
    forwarded = r.ok;
  }

  // Store in the workspace inbox. Best-effort: if the site_messages migration
  // hasn't been applied yet, the email forward above still did the job.
  await supabase.from("site_messages").insert({
    site_id: siteId,
    tenant_id: site.tenant_id,
    kind,
    name,
    email,
    phone,
    service,
    preferred_time: preferredTime,
    message,
    forwarded,
  });

  return done();
}
