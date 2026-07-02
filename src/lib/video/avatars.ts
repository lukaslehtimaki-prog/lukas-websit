// Curated avatar preset library. Each preset is one of OUR personas mapped to a
// whitelisted HeyGen stock avatar + voice pair — users never see the HeyGen catalog.
//
// NOTE: heygenAvatarId / heygenVoiceId must exist on the connected HeyGen account.
// List what's available with:  GET https://api.heygen.com/v2/avatars  and
// GET https://api.heygen.com/v2/voices  (X-Api-Key header). The ids below are
// HeyGen public stock ids; re-verify them when connecting a real key.

export type AvatarPreset = {
  key: string;
  name: string;
  description: string;
  /** Emoji stand-in rendered in the picker (no image assets in v1). */
  emoji: string;
  /** Tailwind gradient classes for the picker card. */
  gradient: string;
  heygenAvatarId: string;
  heygenVoiceId: string;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    key: "mia",
    name: "Mia",
    description: "Upbeat and relatable — like a friend recommending a product she loves.",
    emoji: "👩🏼",
    gradient: "from-pink-500/20 to-orange-500/20",
    heygenAvatarId: "Daisy-inskirt-20220818",
    heygenVoiceId: "2d5b0e6cf36f460aa7fc47e3eee4ba54",
  },
  {
    key: "james",
    name: "James",
    description: "Confident and direct — a straight-talking pitch that gets to the point.",
    emoji: "👨🏽",
    gradient: "from-blue-500/20 to-cyan-500/20",
    heygenAvatarId: "Tyler-incasualsuit-20220721",
    heygenVoiceId: "d7bbcdd6964c47bdaae26decade4a933",
  },
  {
    key: "sofia",
    name: "Sofia",
    description: "Warm and professional — trustworthy expert energy for premium products.",
    emoji: "👩🏻‍💼",
    gradient: "from-violet-500/20 to-fuchsia-500/20",
    heygenAvatarId: "Kristin-incasualsuit-20220818",
    heygenVoiceId: "1bd001e7e50f421d891986aad5158bc8",
  },
  {
    key: "leo",
    name: "Leo",
    description: "Energetic and playful — high-tempo hooks made for short-form feeds.",
    emoji: "🧑🏻",
    gradient: "from-emerald-500/20 to-lime-500/20",
    heygenAvatarId: "Wayne_20240711",
    heygenVoiceId: "077ab11b14f04ce0b49b5f6e5cc20979",
  },
];

export function avatarPreset(key: string): AvatarPreset {
  return AVATAR_PRESETS.find((a) => a.key === key) ?? AVATAR_PRESETS[0];
}

export const TONES = [
  { id: "casual", label: "Casual", hint: "Friendly, everyday social-media voice" },
  { id: "energetic", label: "Energetic", hint: "High-tempo, hype, exclamation-friendly" },
  { id: "professional", label: "Professional", hint: "Polished, credible, benefit-led" },
  { id: "humorous", label: "Humorous", hint: "Light, witty, a wink in the delivery" },
] as const;

export type ToneId = (typeof TONES)[number]["id"];

export function toneLabel(id: string): string {
  return TONES.find((t) => t.id === id)?.label ?? id;
}
