import type { Metadata } from "next";
import { H2, P, UL, A } from "@/components/legal/prose";

export const metadata: Metadata = {
  title: "Terms of Service · Sitovai",
  description:
    "The terms governing your use of Sitovai's lead-finding and AI website-building service.",
};

const CONTACT = "lukas.lehtimaki1@gmail.com";
const UPDATED = "19 July 2026";

export default function TermsPage() {
  return (
    <article>
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
        Legal
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: {UPDATED}</p>

      <P>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
        use of Sitovai (the &ldquo;Service&rdquo;), operated by Lukas Lehtimäki, a
        sole trader based in Finland (Business ID / Y-tunnus: 3638129-8). By creating an account or using the
        Service, you agree to these Terms. If you do not agree, do not use the
        Service.
      </P>

      <H2>1. The Service</H2>
      <P>
        Sitovai helps you find local businesses (including those without a
        website) using the Google Places API and Finland&rsquo;s YTJ / PRH
        business registry, generate websites with AI, and
        manage those leads. Features may change, improve, or be discontinued over
        time.
      </P>

      <H2>2. Accounts</H2>
      <P>
        You must provide accurate information and keep your login credentials
        secure. You are responsible for all activity under your account. You must
        be at least 18 years old and able to enter into a binding contract.
      </P>

      <H2>3. Subscriptions &amp; billing</H2>
      <UL>
        <li>
          Paid plans are billed in euros (EUR) on a recurring monthly basis
          through our payment processor, Stripe. Your subscription begins when
          you complete checkout.
        </li>
        <li>
          Subscriptions renew automatically until cancelled. You can cancel at
          any time from your billing settings; cancellation takes effect at the
          end of the current billing period.
        </li>
        <li>
          Except where required by law, payments are non-refundable. Plan limits
          (searches and websites per month) are shown at checkout.
        </li>
      </UL>

      <H2>3a. Selling websites &amp; payouts</H2>
      <UL>
        <li>
          You can sell websites you create with the Service to your own clients
          using built-in Stripe payment links. To receive these payments you
          must connect a Stripe account through the Service&rsquo;s payout
          onboarding.
        </li>
        <li>
          A platform fee of <strong className="text-zinc-200">15%</strong> of
          each website sale made through the Service is deducted automatically
          from the payment; the remainder is paid out to your connected Stripe
          account under Stripe&rsquo;s own payout schedule and terms.
        </li>
        <li>
          The sale is a transaction between you and your client. You are
          responsible for delivering what you sold, for your own taxes, and for
          handling your client&rsquo;s refund requests; where a refund is
          issued, the platform fee for that sale is not returned unless we
          decide otherwise.
        </li>
      </UL>

      <H2>3b. Partner (affiliate) program</H2>
      <UL>
        <li>
          Partners receive a personal referral link. Customers who sign up
          through it get the advertised discount, and the partner earns a
          commission on referred subscription revenue, at the rate agreed when
          they join the program.
        </li>
        <li>
          Commissions are reported in the platform and paid out manually.
          Self-referrals, misleading promotion, and spam are prohibited and
          forfeit unpaid commissions. We may adjust or end the program with
          reasonable notice.
        </li>
      </UL>

      <H2>4. Acceptable use</H2>
      <P>You agree not to:</P>
      <UL>
        <li>Use the Service for any unlawful purpose or in breach of these Terms.</li>
        <li>
          Send unsolicited communications in violation of applicable marketing,
          privacy, or anti-spam laws.
        </li>
        <li>
          Attempt to disrupt, reverse-engineer, or gain unauthorised access to
          the Service or its infrastructure.
        </li>
        <li>Resell or sublicense the Service without our written permission.</li>
      </UL>

      <H2>5. Your responsibility for outreach &amp; data use</H2>
      <P>
        The Service surfaces business information to help you find prospects. You
        are solely responsible for how you contact those businesses and for
        complying with all applicable laws — including the GDPR and Finnish and
        EU marketing rules — when you do. Sitovai is a tool; it does not send
        outreach on your behalf.
      </P>

      <H2>6. Intellectual property</H2>
      <P>
        The websites, scripts, and other content you generate for your own or
        your clients&rsquo; use are yours. The Sitovai platform, including its
        software, design, and branding, remains our property. You may not copy or
        reuse the platform itself beyond what these Terms allow.
      </P>

      <H2>7. Third-party data &amp; AI output</H2>
      <P>
        Business and registry data is provided &ldquo;as is&rdquo; from
        third-party sources and may be incomplete or out of date. AI-generated
        content may contain errors — you should review it before publishing or
        sending it to a client. We do not guarantee any particular result or
        outcome from using the Service.
      </P>

      <H2>8. Disclaimers &amp; limitation of liability</H2>
      <P>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; without warranties of any kind. To the maximum extent
        permitted by law, we are not liable for any indirect, incidental, or
        consequential damages, and our total liability for any claim relating to
        the Service is limited to the amount you paid us in the three months
        before the event giving rise to the claim. Nothing in these Terms limits
        liability that cannot be limited under applicable law.
      </P>

      <H2>9. Termination</H2>
      <P>
        You may stop using the Service and close your account at any time. We may
        suspend or terminate your access if you breach these Terms or use the
        Service in a way that risks harm to us or others.
      </P>

      <H2>10. Governing law</H2>
      <P>
        These Terms are governed by the laws of Finland, and disputes are subject
        to the jurisdiction of the Finnish courts, without prejudice to any
        mandatory consumer-protection rights you may have.
      </P>

      <H2>11. Changes</H2>
      <P>
        We may update these Terms from time to time. If we make material changes,
        we will update the &ldquo;Last updated&rdquo; date and, where
        appropriate, notify you. Continued use of the Service after changes take
        effect means you accept the revised Terms.
      </P>

      <H2>12. Contact</H2>
      <P>
        Questions about these Terms? Email{" "}
        <A href={`mailto:${CONTACT}`}>{CONTACT}</A>.
      </P>
    </article>
  );
}
