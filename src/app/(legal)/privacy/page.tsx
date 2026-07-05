import type { Metadata } from "next";
import { H2, P, UL, A } from "@/components/legal/prose";

export const metadata: Metadata = {
  title: "Privacy Policy · Sitexa",
  description:
    "How Sitexa collects, uses, and protects your personal data under the EU GDPR.",
};

const CONTACT = "lukas.lehtimaki1@gmail.com";
const UPDATED = "4 July 2026";

export default function PrivacyPage() {
  return (
    <article>
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
        Legal
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: {UPDATED}</p>

      <P>
        This Privacy Policy explains how Sitexa (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;) collects, uses, and protects your personal data when
        you use our website and services (the &ldquo;Service&rdquo;). We process
        personal data in accordance with the EU General Data Protection
        Regulation (GDPR) and applicable Finnish law.
      </P>

      <H2>1. Data controller</H2>
      <P>
        The data controller responsible for your personal data is Lukas
        Lehtimäki, operating as a sole trader in Finland. For any privacy
        questions or to exercise your rights, contact us at{" "}
        <A href={`mailto:${CONTACT}`}>{CONTACT}</A>.
      </P>

      <H2>2. Data we collect</H2>
      <UL>
        <li>
          <strong className="text-zinc-200">Account data</strong> — your email
          address, name, and workspace/company name, provided when you sign up.
        </li>
        <li>
          <strong className="text-zinc-200">Billing data</strong> — subscription
          plan and payment status. Card payments are processed by Stripe; we do
          not store your full card details.
        </li>
        <li>
          <strong className="text-zinc-200">Content you generate</strong> — lead
          lists, generated websites, avatar-video scripts, and related data you
          create in the Service.
        </li>
        <li>
          <strong className="text-zinc-200">Usage &amp; technical data</strong> —
          log data, actions taken in the app, and essential cookies needed to
          keep you signed in.
        </li>
      </UL>

      <H2>3. Business data surfaced through the Service</H2>
      <P>
        The Lead Finder returns information about businesses (such as names,
        addresses, and registry identifiers) sourced from the Google Places API
        and Finland&rsquo;s official YTJ / PRH business registry. This data
        concerns businesses and is provided to help you find potential clients.
        You are responsible for using it lawfully — see our{" "}
        <A href="/terms">Terms of Service</A>.
      </P>

      <H2>4. How we use your data</H2>
      <UL>
        <li>To provide, operate, and maintain the Service.</li>
        <li>To process subscriptions, trials, and payments.</li>
        <li>To respond to support requests and communicate with you.</li>
        <li>To secure the Service and prevent abuse.</li>
        <li>To comply with legal obligations.</li>
      </UL>

      <H2>5. Legal bases (GDPR Article 6)</H2>
      <UL>
        <li>
          <strong className="text-zinc-200">Contract</strong> — to deliver the
          Service you sign up for.
        </li>
        <li>
          <strong className="text-zinc-200">Legitimate interests</strong> — to
          secure, improve, and support the Service.
        </li>
        <li>
          <strong className="text-zinc-200">Legal obligation</strong> — for
          accounting and tax records.
        </li>
        <li>
          <strong className="text-zinc-200">Consent</strong> — where required,
          which you may withdraw at any time.
        </li>
      </UL>

      <H2>6. Service providers (sub-processors)</H2>
      <P>
        We share data only with providers that help us run the Service, under
        appropriate data-processing terms:
      </P>
      <UL>
        <li>
          <strong className="text-zinc-200">Supabase</strong> — database,
          authentication, and file storage.
        </li>
        <li>
          <strong className="text-zinc-200">Vercel</strong> — application
          hosting.
        </li>
        <li>
          <strong className="text-zinc-200">Stripe</strong> — payment
          processing.
        </li>
        <li>
          <strong className="text-zinc-200">Google</strong> — Places API for
          business search.
        </li>
        <li>
          <strong className="text-zinc-200">Anthropic</strong> — AI generation of
          website copy and video scripts.
        </li>
      </UL>
      <P>
        Some providers may process data outside the EU/EEA. Where they do, the
        transfer is protected by appropriate safeguards such as the European
        Commission&rsquo;s Standard Contractual Clauses.
      </P>

      <H2>7. Data retention</H2>
      <P>
        We keep your personal data for as long as your account is active. If you
        close your account, we delete or anonymise your data within a reasonable
        period, except where we must retain it to meet legal obligations (for
        example, billing records required by accounting law).
      </P>

      <H2>8. Your rights</H2>
      <P>
        Under the GDPR you have the right to access, rectify, erase, restrict,
        and port your personal data, and to object to certain processing. To
        exercise any of these, email{" "}
        <A href={`mailto:${CONTACT}`}>{CONTACT}</A>. You also have the right to
        lodge a complaint with the Finnish Data Protection Ombudsman
        (Tietosuojavaltuutetun toimisto).
      </P>

      <H2>9. Security</H2>
      <P>
        We use industry-standard measures — including encryption in transit,
        access controls, and row-level security that isolates each
        workspace&rsquo;s data — to protect your information. No method of
        transmission or storage is completely secure, but we work to protect
        your data using appropriate technical and organisational measures.
      </P>

      <H2>10. Changes to this policy</H2>
      <P>
        We may update this Privacy Policy from time to time. Material changes
        will be reflected by updating the &ldquo;Last updated&rdquo; date above,
        and where appropriate we will notify you.
      </P>

      <H2>11. Contact</H2>
      <P>
        Questions about this policy or your data? Email{" "}
        <A href={`mailto:${CONTACT}`}>{CONTACT}</A>.
      </P>
    </article>
  );
}
