import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "./supabaseClient";

/* =========================================================================
   NOOR SAFAR — Conciergerie Omra
   Single-file React artifact: marketing site + booking flow + admin space.
   ========================================================================= */

/* ---------------------------- Brand assets ---------------------------- */
const LOGO_SRC = "/logo.webp";

/* ---------------------------- Static data ------------------------------ */
const COUNTRIES = [
  { code: "FR", label: "France", flag: "🇫🇷" },
];

const DEPARTURE = null;

const GROUP_THRESHOLD = 10;

const HOTELS = [];

const OFFERS = {
  with: {
    key: "with",
    title: "Avec transport",
    tag: "Formule complète",
    subtitle: "Vols, transferts et hébergement pris en charge de bout en bout.",
    included: [
      "Hébergement sélectionné",
      "Vols et transferts inclus",
      "Accompagnement sur place",
      "Assistance visa touristique",
      "Suivi personnalisé",
    ],
    excluded: [],
    pricing: [],
  },
  without: {
    key: "without",
    title: "Sans transport",
    tag: "Formule modulable",
    subtitle: "Vous organisez votre trajet, nous vous accompagnons pour le reste.",
    included: [
      "Hébergement sélectionné",
      "Accompagnement sur place",
      "Assistance visa touristique",
      "Suivi personnalisé",
    ],
    excluded: ["Vols et transferts"],
    pricing: [],
  },
};

const FAQ_ITEMS = [
  {
    q: "Le départ est-il garanti ?",
    a: "Ce départ groupé se confirme à partir de 10 personnes inscrites. Comme votre demande ne vous engage à aucun paiement, vous ne prenez aucun risque en vous inscrivant tôt — et vous profitez du meilleur tarif dès que le groupe se forme.",
  },
  {
    q: "Le prix peut-il changer avant mon départ ?",
    a: "Le tarif de l'hébergement est stable, mais celui du vol évolue avec la demande à l'approche du départ. En réservant tôt, votre tarif du jour est garanti dès votre demande.",
  },
  {
    q: "Qu'est-ce qui est inclus dans l'offre Sans transport ?",
    a: "L'offre Sans transport comprend l'hébergement, l'accompagnement sur place et l'assistance visa touristique. Le transport (vols et transferts) n'est pas inclus et reste à votre charge.",
  },
  {
    q: "Combien de temps à l'avance dois-je faire ma demande ?",
    a: "Nous recommandons d'anticiper votre demande plusieurs semaines avant la date souhaitée, en particulier sur les périodes de forte affluence. Notre équipe vous précisera les délais adaptés à votre situation.",
  },
  {
    q: "Puis-je faire une demande pour plusieurs voyageurs ?",
    a: "Oui. Vous indiquez le nombre de voyageurs dès votre demande, que vous partiez seul, en famille ou en groupe.",
  },
  {
    q: "Comment se déroule l'accompagnement une fois sur place ?",
    a: "Notre équipe reste joignable pendant toute la durée de votre séjour pour répondre à vos questions et vous accompagner dans l'organisation de votre Omra.",
  },
  {
    q: "Quels documents dois-je préparer ?",
    a: "Un passeport valide est nécessaire. La Omra s'effectue avec un visa touristique saoudien : notre équipe vous précise les documents à fournir selon votre pays de départ.",
  },
  {
    q: "Que se passe-t-il après l'envoi de ma demande ?",
    a: "Vous recevez une confirmation immédiate avec un numéro de référence. Notre équipe vous recontacte ensuite par téléphone ou WhatsApp pour finaliser votre dossier.",
  },
];

const STATUS_LIST = [
  "Nouvelle demande",
  "En cours de traitement",
  "Proposition envoyée",
  "Confirmée",
  "Terminée",
];

const STATUS_STYLE = {
  "Nouvelle demande": { bg: "#F1E9D6", fg: "#8C6C22" },
  "En cours de traitement": { bg: "#EFEBE2", fg: "#6E6852" },
  "Proposition envoyée": { bg: "#F1E9D6", fg: "#8C6C22" },
  "Confirmée": { bg: "#E4EEE7", fg: "#3F6B4A" },
  "Terminée": { bg: "#EDEDED", fg: "#7A7A7A" },
};

const BOOKING_STEPS = ["Départ", "Date", "Offre", "Voyageurs", "Coordonnées", "Récapitulatif"];

const CONTACT = {
  phone: "+33 7 49 66 96 20",
  whatsapp: "+33 7 49 66 96 20",
  email: "contact@noorsafaromra.com",
  instagram: "@noorsafaraccompagnement",
  facebook: "Noor Safar",
};

const WHATSAPP_PREFILL = "Bonjour, je suis intéressé(e) par l'accompagnement Omra avec Noor Safar.";

/* ---------------------------- Utilities -------------------------------- */
function pad(n) {
  return String(n).padStart(2, "0");
}

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function computeCountdown(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  let diff = target.getTime() - now.getTime();
  const past = diff <= 0;
  if (past) diff = 0;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, past };
}

function formatDateLong(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function formatDateShort(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}

function generateRef() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return "NS-" + stamp + rand;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function emptyDraft() {
  return {
    country: null,
    date: "",
    offer: null,
    roomType: null,
    travelers: 1,
    groupNotes: "",
    fullName: "",
    phone: "",
    email: "",
  };
}

/* -------- Supabase <-> app object mapping (snake_case DB, camelCase app) -------- */
function toDbRow(b) {
  return {
    id: b.id,
    ref: b.ref,
    submitted_at: b.submittedAt,
    status: b.status,
    country_code: b.country ? b.country.code : null,
    country_label: b.country ? b.country.label : null,
    country_flag: b.country ? b.country.flag : null,
    omra_date: b.date || null,
    offer: b.offer,
    room_type: b.roomType,
    price_per_person: b.pricePerPerson,
    estimate_total: b.estimateTotal,
    travelers: b.travelers,
    group_notes: b.groupNotes,
    full_name: b.fullName,
    phone: b.phone,
    email: b.email,
  };
}

function fromDbRow(r) {
  return {
    id: r.id,
    ref: r.ref,
    submittedAt: r.submitted_at,
    status: r.status,
    country: r.country_code ? { code: r.country_code, label: r.country_label, flag: r.country_flag } : null,
    date: r.omra_date,
    offer: r.offer,
    roomType: r.room_type,
    pricePerPerson: r.price_per_person,
    estimateTotal: r.estimate_total,
    travelers: r.travelers,
    groupNotes: r.group_notes,
    fullName: r.full_name,
    phone: r.phone,
    email: r.email,
  };
}

/* ------------------------------- Icons ---------------------------------- */
function Ic({ children, size = 20, className = "", ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}
const IconCheck = (p) => <Ic {...p}><path d="M4 12.5l5 5L20 6.5" /></Ic>;
const IconMinus = (p) => <Ic {...p}><path d="M5 12h14" /></Ic>;
const IconChevronDown = (p) => <Ic {...p}><path d="M6 9l6 6 6-6" /></Ic>;
const IconArrowRight = (p) => <Ic {...p}><path d="M4 12h16M13 5l7 7-7 7" /></Ic>;
const IconArrowLeft = (p) => <Ic {...p}><path d="M20 12H4M11 19l-7-7 7-7" /></Ic>;
const IconX = (p) => <Ic {...p}><path d="M6 6l12 12M18 6L6 18" /></Ic>;
const IconMenu = (p) => <Ic {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Ic>;
const IconPhone = (p) => <Ic {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></Ic>;
const IconMail = (p) => <Ic {...p}><path d="M4 6h16v12H4z" /><path d="M4 7l8 6 8-6" /></Ic>;
const IconWhatsapp = (p) => <Ic {...p}><path d="M7 17l-2.5 1 1-2.7A7.5 7.5 0 1 1 9 18.6L7 17Z" /><path d="M9 9.6c0 3 2.4 5.4 5.4 5.4M9 9.6c.2-1 1.4-1 1.6-.2l.4 1.3-1 1a4.7 4.7 0 0 0 2.9 2.9l1-1 1.3.4c.8.2.8 1.4-.2 1.6" /></Ic>;
const IconInstagram = (p) => <Ic {...p}><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.3" /><circle cx="16.3" cy="7.7" r="0.6" fill="currentColor" stroke="none" /></Ic>;
const IconFacebook = (p) => <Ic {...p}><path d="M14 21v-7h2.5l.5-3H14V9c0-.9.3-1.5 1.7-1.5H17V5c-.3 0-1.2-.1-2.2-.1C12.6 4.9 11 6.3 11 9v2H8.5v3H11v7h3Z" fill="currentColor" stroke="none" /></Ic>;
const IconUsers = (p) => <Ic {...p}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 4.3c1.7.4 3 2 3 3.9 0 1.9-1.3 3.5-3 3.9" /><path d="M21 20c0-2.8-1.8-5.1-4.3-5.8" /></Ic>;
const IconCalendar = (p) => <Ic {...p}><rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8 3.5v3M16 3.5v3" /></Ic>;
const IconMapPin = (p) => <Ic {...p}><path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.4" /></Ic>;
const IconShield = (p) => <Ic {...p}><path d="M12 3l7 3v5.5c0 4.6-3 8-7 9.5-4-1.5-7-4.9-7-9.5V6l7-3Z" /><path d="M9 12l2 2 4-4.3" /></Ic>;
const IconPlane = (p) => <Ic {...p}><path d="M10.5 8.5L4 11l2.5 1.3L8 15l1.6-3.6L13 10M10.5 8.5L16 4c1-.7 2.3.6 1.6 1.6L13 11M10.5 8.5L13 11" /></Ic>;
const IconHome = (p) => <Ic {...p}><path d="M4 11.5L12 5l8 6.5" /><path d="M6 10v9h12v-9" /><path d="M10 19v-5h4v5" /></Ic>;
const IconClipboard = (p) => <Ic {...p}><rect x="6" y="5" width="12" height="16" rx="2" /><rect x="9" y="3" width="6" height="3.4" rx="1" /><path d="M9 12h6M9 15.5h6" /></Ic>;
const IconMoon = (p) => <Ic {...p}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" /></Ic>;
const IconLoader = (p) => <Ic {...p} className={"spin " + (p.className || "")}><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></Ic>;
const IconInbox = (p) => <Ic {...p}><path d="M4 12h4l1.5 3h5L16 12h4" /><path d="M5 12L4 6h16l-1 6" /><path d="M4 12v6h16v-6" /></Ic>;

/* ------------------------------ Global CSS ------------------------------ */
function GlobalStyles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap');

html, body { margin:0; padding:0; scroll-behavior:smooth; }

.ns-app{
  --ink:#0B0B0A;
  --ink-soft:#17140F;
  --ink-line: rgba(198,162,76,0.22);
  --ivory:#FAF6EC;
  --ivory-dim:#F1E9D6;
  --gold:#C6A24C;
  --gold-bright:#E4C46E;
  --gold-deep:#8C6C22;
  --slate:#332F26;
  --slate-soft:#6E6852;
  --line:#E4D9BC;
  --green:#3F6B4A;
  --font-display:'Fraunces', ui-serif, Georgia, serif;
  --font-body:'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
  --r-sm:6px; --r-md:14px; --r-lg:24px;
  --container:1180px;
  font-family: var(--font-body);
  color: var(--slate);
  background: var(--ivory);
  -webkit-font-smoothing: antialiased;
  overflow-x:hidden;
  min-height:100vh;
}
.ns-app *, .ns-app *::before, .ns-app *::after{ box-sizing:border-box; }
.ns-app img{ max-width:100%; display:block; }
.ns-app a{ color:inherit; text-decoration:none; }
.ns-app button{ font-family:inherit; cursor:pointer; }
.ns-app h1,.ns-app h2,.ns-app h3,.ns-app h4{ font-family:var(--font-display); margin:0; font-weight:500; color:var(--ink); }
.ns-app p{ margin:0; }
.ns-app ul{ margin:0; padding:0; list-style:none; }
.ns-app section[id]{ scroll-margin-top:88px; }
.ns-app a:focus-visible, .ns-app button:focus-visible, .ns-app input:focus-visible, .ns-app select:focus-visible, .ns-app textarea:focus-visible{ outline:2px solid var(--gold); outline-offset:2px; border-radius:4px; }

.ns-container{ max-width:var(--container); margin-inline:auto; padding-inline:clamp(20px,5vw,56px); }
.ns-section{ padding-block:clamp(56px,9vw,108px); }
.ns-section-tight{ padding-block:clamp(40px,6vw,72px); }
.ns-section-dark{ background:var(--ink); color:var(--ivory-dim); }
.ns-section-dark h1,.ns-section-dark h2,.ns-section-dark h3{ color:var(--ivory); }
.ns-section-dim{ background:var(--ivory-dim); }

.ns-eyebrow{ display:inline-flex; align-items:center; gap:.5rem; font-size:.72rem; letter-spacing:.16em; text-transform:uppercase; color:var(--gold-deep); font-weight:800; }
.ns-section-dark .ns-eyebrow{ color:var(--gold); }
.ns-eyebrow-dash{ width:22px; height:1.5px; background:var(--gold-deep); display:inline-block; }
.ns-section-dark .ns-eyebrow-dash{ background:var(--gold); }
.ns-heading{ margin-top:.7rem; font-size:clamp(1.6rem,2.4vw + 1rem,2.5rem); line-height:1.15; max-width:20ch; }
.ns-subheading{ margin-top:1rem; color:var(--slate-soft); font-size:1rem; line-height:1.65; max-width:56ch; }
.ns-section-dark .ns-subheading{ color:#B9B3A0; }
.ns-head-row{ display:flex; flex-direction:column; }
.ns-head-row.center{ align-items:center; text-align:center; margin-inline:auto; }

.ns-btn{ display:inline-flex; align-items:center; justify-content:center; gap:.55rem; padding:.95rem 1.8rem; border-radius:var(--r-sm); font-weight:700; font-size:.94rem; letter-spacing:.01em; border:1.5px solid transparent; transition:transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease, opacity .18s ease; white-space:nowrap; }
.ns-btn-primary{ background:linear-gradient(180deg,var(--gold-bright),var(--gold)); color:var(--ink); box-shadow:0 1px 0 rgba(255,255,255,.4) inset, 0 8px 20px -10px rgba(0,0,0,.4); }
.ns-btn-primary:hover{ transform:translateY(-1px); box-shadow:0 1px 0 rgba(255,255,255,.5) inset, 0 14px 26px -12px rgba(0,0,0,.5); }
.ns-btn-secondary{ background:transparent; border-color:var(--gold); color:var(--ink); }
.ns-section-dark .ns-btn-secondary{ color:var(--ivory); }
.ns-btn-secondary:hover{ background:rgba(198,162,76,.1); }
.ns-btn-ghost{ background:none; border:none; color:var(--gold-deep); padding:.3rem .1rem; font-weight:700; }
.ns-btn-ghost:hover{ text-decoration:underline; }
.ns-btn-block{ width:100%; }
.ns-btn:disabled{ opacity:.4; cursor:not-allowed; transform:none !important; }

/* Nav */
.ns-nav{ position:sticky; top:0; z-index:40; background:rgba(11,11,10,.9); backdrop-filter:blur(10px); border-bottom:1px solid var(--ink-line); }
.ns-nav-inner{ display:flex; align-items:center; justify-content:space-between; padding-block:.8rem; }
.ns-brand{ display:flex; align-items:center; gap:.65rem; background:none; border:none; padding:0; }
.ns-brand img{ height:40px; width:40px; object-fit:contain; }
.ns-brand-text{ display:flex; flex-direction:column; line-height:1.15; text-align:left; }
.ns-brand-name{ font-family:var(--font-display); font-size:1.08rem; color:var(--ivory); letter-spacing:.01em; }
.ns-brand-tag{ font-size:.6rem; letter-spacing:.16em; text-transform:uppercase; color:var(--gold); }
.ns-nav-links{ display:none; align-items:center; gap:2.1rem; }
.ns-nav-links a{ font-size:.88rem; color:var(--ivory-dim); font-weight:600; }
.ns-nav-links a:hover{ color:var(--gold); }
.ns-nav-actions{ display:flex; align-items:center; gap:.7rem; }
.ns-nav-toggle{ display:inline-flex; background:none; border:none; color:var(--ivory); padding:.3rem; }
@media(min-width:900px){ .ns-nav-links{ display:flex; } .ns-nav-toggle{ display:none; } }
.ns-nav-cta{ display:none; }
@media(min-width:640px){ .ns-nav-cta{ display:inline-flex; } }

.ns-mobile-panel{ position:fixed; inset:0; background:var(--ink); z-index:60; display:flex; flex-direction:column; padding:1.2rem clamp(20px,6vw,40px) 2rem; }
.ns-mobile-panel-top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:2.4rem; }
.ns-mobile-links{ display:flex; flex-direction:column; gap:1.5rem; }
.ns-mobile-links a{ font-family:var(--font-display); font-size:1.5rem; color:var(--ivory); }
.ns-mobile-panel .ns-btn{ margin-top:2rem; }

/* Hero */
.ns-hero{ position:relative; background:var(--ink); overflow:hidden; padding-block:clamp(64px,11vw,128px) clamp(56px,9vw,96px); }
.ns-hero-watermark{ position:absolute; top:50%; right:-12%; width:min(820px,78vw); transform:translateY(-50%); opacity:.07; pointer-events:none; }
.ns-hero-inner{ position:relative; z-index:1; }
.ns-hero h1{ color:var(--ivory); font-size:clamp(2.1rem,4.4vw + 1rem,3.9rem); font-weight:500; line-height:1.1; letter-spacing:-.01em; max-width:15ch; }
.ns-hero h1 span{ color:var(--gold); }
.ns-hero .ns-lead{ margin-top:1.3rem; color:#C9C3AF; font-size:1.05rem; line-height:1.7; max-width:44ch; }
.ns-hero-actions{ display:flex; flex-wrap:wrap; gap:.9rem; margin-top:2.2rem; }
.ns-hero-note{ margin-top:1.6rem; font-size:.85rem; color:var(--slate-soft); display:flex; align-items:center; gap:.55rem; }

/* Services */
.ns-services-grid{ display:grid; gap:1.1rem; margin-top:2.6rem; grid-template-columns:1fr; }
@media(min-width:640px){ .ns-services-grid{ grid-template-columns:repeat(2,1fr); } }
@media(min-width:1024px){ .ns-services-grid{ grid-template-columns:repeat(4,1fr); } }
.ns-service-card{ background:#fff; border:1px solid var(--line); border-radius:var(--r-md); padding:1.7rem 1.4rem; }
.ns-service-icon{ width:44px; height:44px; border-radius:11px; background:var(--ivory-dim); display:flex; align-items:center; justify-content:center; color:var(--gold-deep); margin-bottom:1.1rem; }
.ns-service-card h3{ font-size:1.04rem; margin-bottom:.45rem; }
.ns-service-card p{ color:var(--slate-soft); font-size:.9rem; line-height:1.55; }

/* Countries */
.ns-country-grid{ display:grid; gap:1rem; margin-top:2.6rem; grid-template-columns:1fr; }
@media(min-width:640px){ .ns-country-grid{ grid-template-columns:repeat(3,1fr); } }
.ns-country-card{ display:flex; align-items:center; gap:1rem; padding:1.3rem 1.4rem; border:1.5px solid var(--line); border-radius:var(--r-md); background:#fff; transition:border-color .18s, transform .18s, box-shadow .18s; text-align:left; width:100%; }
.ns-country-card:hover{ border-color:var(--gold); transform:translateY(-2px); box-shadow:0 14px 30px -20px rgba(0,0,0,.35); }
.ns-country-card.is-selected{ border-color:var(--gold); background:linear-gradient(180deg,#fff,var(--ivory-dim)); box-shadow:0 0 0 3px rgba(198,162,76,.16); }
.ns-country-flag{ font-size:1.9rem; line-height:1; }
.ns-country-name{ font-family:var(--font-display); font-size:1.08rem; color:var(--ink); }
.ns-country-sub{ font-size:.78rem; color:var(--slate-soft); margin-top:.15rem; }
.ns-country-check{ margin-left:auto; color:var(--gold); flex-shrink:0; }

/* Engagements */
.ns-engage-grid{ display:grid; gap:1.4rem; margin-top:2.6rem; grid-template-columns:1fr; }
@media(min-width:768px){ .ns-engage-grid{ grid-template-columns:repeat(3,1fr); } }
.ns-engage-card{ border:1px solid var(--ink-line); border-radius:var(--r-md); padding:1.9rem 1.6rem; background:linear-gradient(180deg,rgba(198,162,76,.06),transparent); }
.ns-engage-icon{ width:42px; height:42px; border-radius:11px; background:rgba(198,162,76,.12); color:var(--gold); display:flex; align-items:center; justify-content:center; margin-bottom:1.1rem; }
.ns-engage-card h3{ font-size:1.14rem; margin-bottom:.55rem; }
.ns-engage-card p{ color:#B9B3A0; font-size:.9rem; line-height:1.6; }

/* Offers */
.ns-offers-grid{ display:grid; gap:1.5rem; margin-top:2.6rem; grid-template-columns:1fr; }
@media(min-width:820px){ .ns-offers-grid{ grid-template-columns:repeat(2,1fr); } }
.ns-offer-card{ border:1.5px solid var(--line); border-radius:var(--r-lg); background:#fff; padding:2rem 1.9rem; display:flex; flex-direction:column; transition:border-color .18s, box-shadow .18s; }
.ns-offer-card.is-selected{ border-color:var(--gold); box-shadow:0 0 0 3px rgba(198,162,76,.16); }
.ns-offer-tag{ font-size:.68rem; letter-spacing:.1em; text-transform:uppercase; color:var(--gold-deep); font-weight:800; }
.ns-offer-card h3{ font-size:1.4rem; margin-top:.5rem; }
.ns-offer-sub{ color:var(--slate-soft); font-size:.9rem; margin-top:.4rem; margin-bottom:1.6rem; line-height:1.5; }
.ns-offer-list{ display:flex; flex-direction:column; gap:.8rem; margin-bottom:1.8rem; flex:1; }
.ns-offer-list li{ display:flex; align-items:center; gap:.7rem; font-size:.93rem; }
.ns-offer-list li.is-excluded{ color:var(--slate-soft); opacity:.65; }
.ns-offer-list li.is-excluded span{ text-decoration:line-through; }
.ns-ico-yes{ color:var(--green); flex-shrink:0; }
.ns-ico-no{ color:var(--slate-soft); flex-shrink:0; }
.ns-offer-price{ font-size:.84rem; color:var(--slate-soft); margin-bottom:1.1rem; }
.ns-offer-startprice{ display:flex; align-items:baseline; gap:.4rem; margin-bottom:1.5rem; }
.ns-offer-startprice-label{ font-size:.78rem; color:var(--slate-soft); }
.ns-offer-startprice-value{ font-family:var(--font-display); font-size:2rem; color:var(--gold-deep); line-height:1; }
.ns-offer-startprice-unit{ font-size:.78rem; color:var(--slate-soft); }
.ns-offer-pricing{ display:grid; grid-template-columns:repeat(4,1fr); border:1px solid var(--line); border-radius:var(--r-sm); overflow:hidden; margin-bottom:.9rem; }
.ns-offer-price-cell{ display:flex; flex-direction:column; align-items:center; gap:.3rem; padding:.75rem .4rem; border-left:1px solid var(--line); background:var(--ivory-dim); }
.ns-offer-price-cell:first-child{ border-left:none; }
.ns-offer-price-cell-label{ font-size:.66rem; letter-spacing:.06em; text-transform:uppercase; color:var(--slate-soft); }
.ns-offer-price-cell-value{ font-family:var(--font-display); font-size:1.05rem; color:var(--ink); }

/* Departure / hotel banner */
.ns-price-banner{ display:flex; align-items:flex-start; gap:1.1rem; margin-top:2.4rem; padding:1.6rem 1.8rem; border-radius:var(--r-lg); background:linear-gradient(135deg,var(--gold-bright),var(--gold)); }
.ns-price-banner-icon{ width:46px; height:46px; border-radius:50%; background:rgba(11,11,10,.12); color:var(--ink); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ns-price-banner-title{ font-family:var(--font-display); font-size:clamp(1.25rem,1.6vw + 1rem,1.7rem); line-height:1.25; color:var(--ink); font-weight:600; margin:0 0 .4rem; }
.ns-price-banner-sub{ font-size:.95rem; color:rgba(11,11,10,.72); line-height:1.55; max-width:60ch; margin:0; }
.ns-departure-banner{ display:flex; flex-direction:column; gap:1rem; margin-top:1.6rem; margin-bottom:-.6rem; padding:1.2rem 1.4rem; border:1px dashed var(--gold); border-radius:var(--r-md); background:linear-gradient(180deg,rgba(198,162,76,.07),transparent); }
.ns-departure-top{ display:flex; flex-direction:column; gap:1rem; }
@media(min-width:768px){ .ns-departure-top{ flex-direction:row; align-items:center; justify-content:space-between; flex-wrap:wrap; } }
.ns-departure-min{ display:flex; align-items:center; gap:.55rem; font-size:.82rem; color:var(--slate-soft); padding-top:.9rem; border-top:1px solid var(--line); }
.ns-departure-min svg{ color:var(--gold-deep); flex-shrink:0; }
.ns-departure-min strong{ color:var(--ink); }
.ns-departure-when{ display:flex; align-items:center; gap:.6rem; color:var(--gold-deep); font-size:.92rem; flex-shrink:0; }
.ns-departure-when strong{ color:var(--ink); }
.ns-hotel-chips{ display:flex; flex-direction:column; gap:.6rem; }
@media(min-width:560px){ .ns-hotel-chips{ flex-direction:row; flex-wrap:wrap; } }
.ns-hotel-chip{ display:flex; align-items:center; gap:.6rem; font-size:.84rem; color:var(--slate); }
.ns-hotel-chip svg{ color:var(--gold-deep); flex-shrink:0; }
.ns-hotel-chip-city{ font-weight:800; display:block; }
.ns-hotel-chip-name{ color:var(--slate-soft); display:block; }

/* Room type picker */
.ns-room-grid{ display:grid; gap:.8rem; grid-template-columns:1fr; }
@media(min-width:560px){ .ns-room-grid{ grid-template-columns:repeat(2,1fr); } }
.ns-room-pill{ display:flex; flex-direction:column; gap:.25rem; text-align:left; padding:1rem 1.1rem; border:1.5px solid var(--line); border-radius:var(--r-md); background:#fff; transition:border-color .18s, box-shadow .18s; }
.ns-room-pill:hover{ border-color:var(--gold); }
.ns-room-pill.is-selected{ border-color:var(--gold); box-shadow:0 0 0 3px rgba(198,162,76,.16); }
.ns-room-pill-label{ font-family:var(--font-display); font-size:1.05rem; color:var(--ink); }
.ns-room-pill-people{ font-size:.78rem; color:var(--slate-soft); }
.ns-room-pill-price{ font-size:1.1rem; font-weight:800; color:var(--gold-deep); margin-top:.2rem; }
.ns-room-pill-price span{ font-size:.72rem; font-weight:600; color:var(--slate-soft); }
.ns-estimate-note{ margin-top:1rem; font-size:.86rem; color:var(--slate-soft); line-height:1.5; }
.ns-estimate-note strong{ color:var(--ink); font-family:var(--font-display); font-size:1.05rem; }

/* FAQ */
.ns-faq-list{ margin-top:2.4rem; border-top:1px solid var(--line); }
.ns-faq-item{ border-bottom:1px solid var(--line); }
.ns-faq-q{ width:100%; display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:1.35rem 0; background:none; border:none; text-align:left; font-family:var(--font-display); font-size:1.02rem; color:var(--ink); }
.ns-faq-q .ns-chev{ transition:transform .25s ease; color:var(--gold-deep); flex-shrink:0; }
.ns-faq-item.is-open .ns-chev{ transform:rotate(180deg); }
.ns-faq-a{ overflow:hidden; max-height:0; transition:max-height .3s ease; }
.ns-faq-item.is-open .ns-faq-a{ max-height:320px; }
.ns-faq-a-inner{ padding-bottom:1.4rem; color:var(--slate-soft); font-size:.93rem; line-height:1.65; max-width:65ch; }

/* Contact */
.ns-contact-grid{ display:grid; gap:2.6rem; margin-top:2.6rem; grid-template-columns:1fr; }
@media(min-width:900px){ .ns-contact-grid{ grid-template-columns:1fr 1fr; align-items:start; } }
.ns-contact-methods{ display:flex; flex-direction:column; gap:.9rem; }
.ns-contact-method{ display:flex; align-items:center; gap:1rem; padding:1rem 1.1rem; border:1px solid var(--ink-line); border-radius:var(--r-md); background:rgba(255,255,255,.02); }
.ns-contact-method-ico{ width:40px; height:40px; border-radius:10px; background:rgba(198,162,76,.12); color:var(--gold); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ns-contact-method-label{ font-size:.7rem; letter-spacing:.08em; text-transform:uppercase; color:#9A9480; }
.ns-contact-method-value{ font-family:var(--font-display); color:var(--ivory); font-size:1rem; }
.ns-form{ display:flex; flex-direction:column; gap:1rem; }
.ns-field{ display:flex; flex-direction:column; gap:.4rem; }
.ns-field label{ font-size:.8rem; color:var(--slate-soft); font-weight:700; }
.ns-section-dark .ns-field label{ color:#B9B3A0; }
.ns-input,.ns-textarea,.ns-select{ background:#fff; border:1.5px solid var(--line); border-radius:var(--r-sm); padding:.85rem 1rem; font-family:var(--font-body); font-size:.95rem; width:100%; color:var(--slate); }
.ns-input:focus,.ns-textarea:focus,.ns-select:focus{ outline:none; border-color:var(--gold); box-shadow:0 0 0 3px rgba(198,162,76,.18); }
.ns-section-dark .ns-input,.ns-section-dark .ns-textarea,.ns-section-dark .ns-select{ background:rgba(255,255,255,.05); border-color:var(--ink-line); color:var(--ivory); }
.ns-section-dark .ns-input::placeholder,.ns-section-dark .ns-textarea::placeholder{ color:rgba(250,246,236,.35); }
.ns-textarea{ resize:vertical; min-height:110px; }
.ns-form-note{ font-size:.82rem; color:#9A9480; margin-top:.2rem; }
.ns-form-success{ display:flex; align-items:center; gap:.6rem; background:rgba(198,162,76,.12); border:1px solid var(--ink-line); color:var(--gold-bright); padding:.9rem 1.1rem; border-radius:var(--r-sm); font-size:.9rem; font-weight:600; }

/* Footer */
.ns-footer{ background:var(--ink-soft); color:#9A9480; padding-block:3.4rem 2rem; }
.ns-footer-top{ display:grid; gap:2.6rem; grid-template-columns:1fr; padding-bottom:2.4rem; border-bottom:1px solid var(--ink-line); }
@media(min-width:768px){ .ns-footer-top{ grid-template-columns:1.4fr 1fr 1fr 1fr; } }
.ns-footer-brand{ display:flex; align-items:center; gap:.7rem; margin-bottom:1rem; }
.ns-footer-brand img{ height:38px; width:38px; }
.ns-footer-brand-name{ font-family:var(--font-display); color:var(--ivory); font-size:1.1rem; }
.ns-footer-desc{ font-size:.88rem; line-height:1.6; max-width:32ch; }
.ns-footer h4{ color:var(--ivory-dim); font-size:.74rem; letter-spacing:.1em; text-transform:uppercase; margin-bottom:1rem; font-family:var(--font-body); font-weight:800; }
.ns-footer ul{ display:flex; flex-direction:column; gap:.7rem; }
.ns-footer a{ font-size:.9rem; }
.ns-footer a:hover{ color:var(--gold); }
.ns-footer-bottom{ display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:1rem; padding-top:1.6rem; font-size:.8rem; }
.ns-footer-admin-link{ opacity:.55; font-size:.78rem; background:none; border:none; color:#9A9480; }
.ns-footer-admin-link:hover{ opacity:1; color:var(--gold); }

/* Floating WhatsApp button */
.ns-float-whatsapp{ position:fixed; bottom:20px; right:18px; z-index:50; width:56px; height:56px; border-radius:50%; background:linear-gradient(180deg,var(--gold-bright),var(--gold)); color:var(--ink); display:flex; align-items:center; justify-content:center; box-shadow:0 10px 26px -8px rgba(0,0,0,.5), 0 1px 0 rgba(255,255,255,.4) inset; transition:transform .18s ease, box-shadow .18s ease; }
.ns-float-whatsapp:hover{ transform:translateY(-2px) scale(1.05); box-shadow:0 14px 30px -8px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,.5) inset; }
@media(min-width:900px){ .ns-float-whatsapp{ bottom:28px; right:28px; width:60px; height:60px; } }

/* Booking flow */
.ns-flow{ min-height:100vh; background:var(--ivory); }
.ns-flow-header{ position:sticky; top:0; z-index:30; background:rgba(250,246,236,.94); backdrop-filter:blur(8px); border-bottom:1px solid var(--line); }
.ns-flow-header-inner{ display:flex; align-items:center; justify-content:space-between; padding-block:1rem; }
.ns-flow-close{ display:inline-flex; align-items:center; gap:.4rem; background:none; border:none; color:var(--slate-soft); font-size:.86rem; font-weight:700; }
.ns-flow-close:hover{ color:var(--ink); }
.ns-flow-step-label{ font-size:.78rem; color:var(--slate-soft); font-weight:700; }
.ns-progress{ height:4px; background:var(--line); position:relative; overflow:hidden; }
.ns-progress-bar{ position:absolute; inset:0 auto 0 0; background:linear-gradient(90deg,var(--gold-deep),var(--gold)); transition:width .35s ease; }
.ns-flow-body{ max-width:720px; margin-inline:auto; padding:clamp(2rem,6vw,3.6rem) clamp(20px,5vw,40px) 6rem; }
.ns-flow-title{ font-size:clamp(1.45rem,2.4vw + 1rem,2rem); margin-bottom:.5rem; }
.ns-flow-sub{ color:var(--slate-soft); margin-bottom:2.2rem; max-width:54ch; line-height:1.6; }
.ns-flow-actions{ display:flex; justify-content:space-between; gap:1rem; margin-top:2.8rem; }
.ns-flow-actions .ns-btn{ min-width:132px; }
.ns-field-error{ font-size:.8rem; color:#B23A3A; margin-top:.2rem; }

.ns-stepper{ display:inline-flex; align-items:center; gap:1.2rem; border:1.5px solid var(--line); border-radius:999px; padding:.5rem 1rem; background:#fff; }
.ns-stepper button{ width:34px; height:34px; border-radius:50%; border:1px solid var(--line); background:#fff; display:flex; align-items:center; justify-content:center; color:var(--ink); }
.ns-stepper button:hover:not(:disabled){ border-color:var(--gold); color:var(--gold-deep); }
.ns-stepper button:disabled{ opacity:.35; cursor:not-allowed; }
.ns-stepper-value{ font-family:var(--font-display); font-size:1.4rem; min-width:2ch; text-align:center; }

.ns-recap-card{ border:1px solid var(--line); border-radius:var(--r-md); background:#fff; padding:.4rem 1.6rem; margin-bottom:1.6rem; }
.ns-recap-row{ display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding-block:1rem; border-bottom:1px solid var(--ivory-dim); }
.ns-recap-row:last-child{ border-bottom:none; }
.ns-recap-label{ font-size:.7rem; letter-spacing:.08em; text-transform:uppercase; color:var(--slate-soft); margin-bottom:.3rem; }
.ns-recap-value{ font-family:var(--font-display); font-size:1.03rem; color:var(--ink); }
.ns-recap-edit{ font-size:.82rem; color:var(--gold-deep); font-weight:800; background:none; border:none; flex-shrink:0; }
.ns-recap-edit:hover{ text-decoration:underline; }
.ns-consent{ display:flex; gap:.6rem; align-items:flex-start; font-size:.84rem; color:var(--slate-soft); margin-top:1.6rem; line-height:1.5; }

.ns-success{ text-align:center; padding-block:1.4rem; }
.ns-success-ico{ width:74px; height:74px; border-radius:50%; background:linear-gradient(180deg,var(--gold-bright),var(--gold)); display:flex; align-items:center; justify-content:center; margin:0 auto 1.6rem; color:var(--ink); }
.ns-success p{ color:var(--slate-soft); max-width:48ch; margin-inline:auto; line-height:1.65; margin-top:.8rem; }
.ns-success-ref{ display:inline-block; margin-top:1.4rem; font-family:var(--font-display); font-size:1.25rem; letter-spacing:.03em; color:var(--gold-deep); border:1.5px dashed var(--gold); border-radius:999px; padding:.55rem 1.5rem; }
.ns-success .ns-ticket-wrap{ margin-top:2.2rem; text-align:left; }

/* Ticket (signature element) */
.ns-ticket-wrap{ background:var(--ivory); border-radius:calc(var(--r-lg) + 5px); padding:6px; }
.ns-ticket{ position:relative; background:var(--ink); border-radius:var(--r-lg); border:1px solid var(--ink-line); padding:1.6rem 1.7rem 1.4rem; color:var(--ivory); overflow:visible; }
.ns-ticket::before,.ns-ticket::after{ content:""; position:absolute; width:24px; height:24px; background:var(--ivory); border-radius:50%; top:50%; transform:translateY(-50%); }
.ns-ticket::before{ left:-12px; }
.ns-ticket::after{ right:-12px; }
.ns-ticket-route{ display:flex; align-items:center; font-size:.66rem; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); margin-bottom:.6rem; }
.ns-ticket-route-line{ flex:1; height:0; border-top:1.5px dashed rgba(198,162,76,.5); margin:0 .7rem; }
.ns-ticket-cities{ display:flex; align-items:baseline; justify-content:space-between; gap:1rem; margin-bottom:1.1rem; }
.ns-ticket-city{ font-family:var(--font-display); font-size:1.08rem; color:var(--ivory); }
.ns-ticket-city.dest{ text-align:right; color:var(--gold-bright); }
.ns-ticket-date{ font-family:var(--font-display); font-size:clamp(1.1rem,2vw + .5rem,1.4rem); color:var(--gold-bright); margin-bottom:1.3rem; }
.ns-ticket-perf{ border-top:1.5px dashed var(--ink-line); margin:0 -1.7rem 1.3rem; }
.ns-ticket-countdown{ display:grid; grid-template-columns:repeat(4,1fr); gap:.5rem; margin-bottom:1.3rem; }
.ns-ticket-unit{ text-align:center; }
.ns-ticket-unit-num{ font-family:var(--font-display); font-variant-numeric:tabular-nums; font-size:clamp(1.4rem,3vw + .4rem,1.9rem); color:var(--ivory); line-height:1; }
.ns-ticket-unit-label{ font-size:.6rem; letter-spacing:.1em; text-transform:uppercase; color:#8B876F; margin-top:.4rem; }
.ns-ticket-barcode{ height:24px; background:repeating-linear-gradient(90deg,var(--gold) 0 2px,transparent 2px 5px,var(--gold-deep) 5px 6px,transparent 6px 9px); opacity:.5; border-radius:2px; margin-bottom:.7rem; }
.ns-ticket-ref{ font-size:.72rem; letter-spacing:.08em; color:#8B876F; text-align:center; }
.ns-ticket-past{ text-align:center; padding:1rem 0; font-family:var(--font-display); color:var(--gold-bright); font-size:1.1rem; }

/* Admin */
.ns-admin{ min-height:100vh; background:var(--ivory-dim); }
.ns-admin-header{ background:var(--ink); color:var(--ivory); padding-block:1.4rem; }
.ns-admin-header-inner{ display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
.ns-admin-title h1{ color:var(--ivory); font-size:1.25rem; }
.ns-admin-title span{ font-size:.7rem; color:#8B876F; letter-spacing:.06em; text-transform:uppercase; margin-top:.25rem; display:block; }
.ns-admin-body{ padding-block:2.2rem; }
.ns-admin-tabs{ display:flex; gap:.5rem; flex-wrap:wrap; margin-bottom:1.8rem; }
.ns-admin-tab{ padding:.55rem 1.05rem; border-radius:999px; border:1px solid var(--line); background:#fff; font-size:.8rem; font-weight:700; color:var(--slate-soft); }
.ns-admin-tab.is-active{ background:var(--ink); border-color:var(--ink); color:var(--gold); }
.ns-booking-card{ background:#fff; border:1px solid var(--line); border-radius:var(--r-md); padding:1.3rem 1.4rem; margin-bottom:1rem; }
.ns-booking-card-top{ display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:.8rem; }
.ns-booking-ref{ font-family:var(--font-display); font-size:1rem; color:var(--ink); }
.ns-booking-meta{ font-size:.75rem; color:var(--slate-soft); margin-top:.15rem; }
.ns-booking-grid{ display:grid; gap:.9rem; margin-top:1.1rem; grid-template-columns:repeat(2,1fr); }
@media(min-width:640px){ .ns-booking-grid{ grid-template-columns:repeat(4,1fr); } }
.ns-booking-field-label{ font-size:.64rem; letter-spacing:.07em; text-transform:uppercase; color:var(--slate-soft); }
.ns-booking-field-value{ font-size:.92rem; color:var(--ink); font-weight:700; margin-top:.2rem; }
.ns-status-badge{ display:inline-flex; align-items:center; gap:.4rem; padding:.32rem .75rem; border-radius:999px; font-size:.72rem; font-weight:800; }
.ns-status-row{ display:flex; align-items:center; gap:.8rem; margin-top:1.1rem; flex-wrap:wrap; }
.ns-status-select{ max-width:220px; }
.ns-booking-details-toggle{ margin-top:1rem; font-size:.82rem; color:var(--gold-deep); font-weight:800; background:none; border:none; display:inline-flex; align-items:center; gap:.3rem; }
.ns-booking-details{ margin-top:1rem; padding-top:1rem; border-top:1px solid var(--ivory-dim); display:grid; gap:.6rem; font-size:.88rem; }
.ns-empty-state{ text-align:center; padding:4.5rem 1.5rem; color:var(--slate-soft); }
.ns-empty-state svg{ margin-bottom:1rem; color:var(--slate-soft); }
.ns-loading{ display:flex; align-items:center; justify-content:center; padding:4rem 0; color:var(--slate-soft); gap:.6rem; }
.spin{ animation:ns-spin 1s linear infinite; }
@keyframes ns-spin{ to{ transform:rotate(360deg); } }
.ns-admin-note{ font-size:.78rem; color:var(--slate-soft); background:#fff; border:1px dashed var(--line); border-radius:var(--r-sm); padding:.7rem 1rem; margin-bottom:1.6rem; }
.ns-admin-stat{ background:var(--ink); border-radius:var(--r-md); padding:1.1rem 1.3rem; display:flex; flex-direction:column; gap:.3rem; margin-bottom:1.6rem; }
.ns-admin-stat-label{ font-size:.72rem; letter-spacing:.06em; text-transform:uppercase; color:#8B876F; }
.ns-admin-stat-value{ font-family:var(--font-display); font-size:1.6rem; color:var(--gold-bright); }

@media (prefers-reduced-motion: reduce){
  .ns-app *{ animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; }
  html{ scroll-behavior:auto !important; }
}
`}</style>
  );
}

/* ------------------------------ Shared bits ----------------------------- */
function SectionHeading({ eyebrow, title, subtitle, center }) {
  return (
    <div className={"ns-head-row" + (center ? " center" : "")}>
      <span className="ns-eyebrow"><span className="ns-eyebrow-dash" />{eyebrow}</span>
      <h2 className="ns-heading">{title}</h2>
      {subtitle && <p className="ns-subheading">{subtitle}</p>}
    </div>
  );
}

function CountryPicker({ value, onChange }) {
  return (
    <div className="ns-country-grid">
      {COUNTRIES.map((c) => {
        const selected = value && value.code === c.code;
        return (
          <button
            key={c.code}
            type="button"
            className={"ns-country-card" + (selected ? " is-selected" : "")}
            onClick={() => onChange(c)}
            aria-pressed={selected}
          >
            <span className="ns-country-flag" aria-hidden="true">{c.flag}</span>
            <span>
              <span className="ns-country-name">{c.label}</span>
              <span className="ns-country-sub" style={{ display: "block" }}>Point de départ</span>
            </span>
            {selected && <span className="ns-country-check"><IconCheck size={20} /></span>}
          </button>
        );
      })}
    </div>
  );
}

function OfferPicker({ value, onChange, actionLabel, onAction }) {
  return (
    <div className="ns-offers-grid">
      {Object.values(OFFERS).map((o) => {
        const selected = value === o.key;
        const hasPricing = o.pricing && o.pricing.length > 0;
        const minPrice = hasPricing ? Math.min(...o.pricing.map((p) => p.price)) : null;
        return (
          <div key={o.key} className={"ns-offer-card" + (selected ? " is-selected" : "")}>
            <span className="ns-offer-tag">{o.tag}</span>
            <h3>{o.title}</h3>
            <p className="ns-offer-sub">{o.subtitle}</p>
            {hasPricing ? (
              <div className="ns-offer-startprice">
                <span className="ns-offer-startprice-label">À partir de</span>
                <span className="ns-offer-startprice-value">{minPrice}€</span>
                <span className="ns-offer-startprice-unit">/ personne</span>
              </div>
            ) : (
              <p className="ns-form-note" style={{ marginBottom: "1.2rem" }}>Tarifs à venir</p>
            )}
            <ul className="ns-offer-list">
              {o.included.map((item) => (
                <li key={item}><IconCheck size={18} className="ns-ico-yes" /><span>{item}</span></li>
              ))}
              {o.excluded.map((item) => (
                <li key={item} className="is-excluded"><IconMinus size={18} className="ns-ico-no" /><span>{item}</span></li>
              ))}
            </ul>
            {hasPricing && (
              <>
                <div className="ns-offer-pricing">
                  {o.pricing.map((p) => (
                    <div className="ns-offer-price-cell" key={p.key}>
                      <span className="ns-offer-price-cell-label">{p.label}</span>
                      <span className="ns-offer-price-cell-value">{p.price}€</span>
                    </div>
                  ))}
                </div>
                <p className="ns-offer-price">{DEPARTURE ? "Prix par personne, départ " + DEPARTURE.label + ". " : "Prix par personne. "}Tarif confirmé par notre équipe.</p>
              </>
            )}
            {onAction ? (
              <button type="button" className={"ns-btn " + (selected ? "ns-btn-primary" : "ns-btn-secondary") + " ns-btn-block"} onClick={() => onAction(o.key)}>
                {selected ? "Sélectionnée" : (actionLabel || "Choisir cette offre")}
              </button>
            ) : (
              <button type="button" className={"ns-btn " + (selected ? "ns-btn-primary" : "ns-btn-secondary") + " ns-btn-block"} onClick={() => onChange(o.key)}>
                {selected ? "Sélectionnée" : "Choisir cette offre"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RoomTypePicker({ offerKey, value, onChange }) {
  if (!offerKey || !OFFERS[offerKey]) return null;
  const pricing = OFFERS[offerKey].pricing;
  if (!pricing || pricing.length === 0) {
    return <p className="ns-form-note">Les configurations de chambre seront ajoutées prochainement pour cette offre.</p>;
  }
  return (
    <div className="ns-room-grid" role="group" aria-label="Configuration de chambre">
      {pricing.map((p) => {
        const selected = value === p.key;
        return (
          <button
            key={p.key}
            type="button"
            className={"ns-room-pill" + (selected ? " is-selected" : "")}
            onClick={() => onChange(p.key)}
            aria-pressed={selected}
          >
            <span className="ns-room-pill-label">Chambre {p.label}</span>
            <span className="ns-room-pill-people">{p.people} {p.people > 1 ? "personnes / chambre" : "personne / chambre"}</span>
            <span className="ns-room-pill-price">{p.price}€ <span>/ pers.</span></span>
          </button>
        );
      })}
    </div>
  );
}

function CountdownTicket({ country, date, refCode }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const c = useMemo(() => computeCountdown(date), [date, tick]);
  if (!date || !c) return null;
  return (
    <div className="ns-ticket-wrap">
      <div className="ns-ticket">
        <div className="ns-ticket-route">
          <span>Départ</span>
          <span className="ns-ticket-route-line" />
          <span>Omra</span>
        </div>
        <div className="ns-ticket-cities">
          <span className="ns-ticket-city">{country ? country.flag + " " + country.label : "—"}</span>
          <span className="ns-ticket-city dest">La Mecque</span>
        </div>
        <div className="ns-ticket-date">{formatDateLong(date)}</div>
        <div className="ns-ticket-perf" />
        {c.past ? (
          <div className="ns-ticket-past">Votre date de Omra est arrivée 🌙</div>
        ) : (
          <div className="ns-ticket-countdown">
            <div className="ns-ticket-unit"><div className="ns-ticket-unit-num">{c.days}</div><div className="ns-ticket-unit-label">Jours</div></div>
            <div className="ns-ticket-unit"><div className="ns-ticket-unit-num">{pad(c.hours)}</div><div className="ns-ticket-unit-label">Heures</div></div>
            <div className="ns-ticket-unit"><div className="ns-ticket-unit-num">{pad(c.minutes)}</div><div className="ns-ticket-unit-label">Minutes</div></div>
            <div className="ns-ticket-unit"><div className="ns-ticket-unit-num">{pad(c.seconds)}</div><div className="ns-ticket-unit-label">Secondes</div></div>
          </div>
        )}
        <div className="ns-ticket-barcode" />
        <div className="ns-ticket-ref">{refCode ? refCode : "NS-• • • • • •"}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE["Nouvelle demande"];
  return <span className="ns-status-badge" style={{ background: s.bg, color: s.fg }}>{status}</span>;
}

/* --------------------------------- Nav ----------------------------------- */
function Nav({ onStartBooking }) {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#services", label: "Services" },
    { href: "#offres", label: "Nos offres" },
    { href: "#faq", label: "FAQ" },
    { href: "#contact", label: "Contact" },
  ];
  return (
    <>
      <header className="ns-nav">
        <div className="ns-container ns-nav-inner">
          <a href="#accueil" className="ns-brand" aria-label="Noor Safar — Accueil">
            <img src={LOGO_SRC} alt="" />
            <span className="ns-brand-text">
              <span className="ns-brand-name">Noor Safar</span>
              <span className="ns-brand-tag">Accompagnement Omra</span>
            </span>
          </a>
          <nav className="ns-nav-links" aria-label="Navigation principale">
            {links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          </nav>
          <div className="ns-nav-actions">
            <button type="button" className="ns-btn ns-btn-primary ns-nav-cta" onClick={onStartBooking}>Préparer ma Omra</button>
            <button type="button" className="ns-nav-toggle" aria-label="Ouvrir le menu" onClick={() => setOpen(true)}>
              <IconMenu size={26} />
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="ns-mobile-panel" role="dialog" aria-modal="true">
          <div className="ns-mobile-panel-top">
            <span className="ns-brand-text">
              <span className="ns-brand-name">Noor Safar</span>
            </span>
            <button type="button" className="ns-nav-toggle" aria-label="Fermer le menu" onClick={() => setOpen(false)}>
              <IconX size={26} />
            </button>
          </div>
          <nav className="ns-mobile-links" aria-label="Navigation mobile">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
            ))}
          </nav>
          <button
            type="button"
            className="ns-btn ns-btn-primary ns-btn-block"
            onClick={() => { setOpen(false); onStartBooking(); }}
          >
            Préparer ma Omra
          </button>
        </div>
      )}
    </>
  );
}

/* --------------------------------- Hero ----------------------------------- */
function Hero({ onStartBooking, onDiscover }) {
  return (
    <section id="accueil" className="ns-hero ns-section-dark">
      <img className="ns-hero-watermark" src={LOGO_SRC} alt="" aria-hidden="true" />
      <div className="ns-container ns-hero-inner">
        <span className="ns-eyebrow"><span className="ns-eyebrow-dash" />Conciergerie Omra</span>
        <h1>Votre Omra, portée avec soin, <span>du premier pas au retour.</span></h1>
        <p className="ns-lead">Noor Safar organise chaque détail de votre voyage — hébergement, transport, accompagnement — pour que vous puissiez vivre votre Omra en toute sérénité.</p>
        <div className="ns-hero-actions">
          <button type="button" className="ns-btn ns-btn-primary" onClick={onStartBooking}>
            Préparer ma Omra <IconArrowRight size={18} />
          </button>
          <button type="button" className="ns-btn ns-btn-secondary" onClick={onDiscover}>Découvrir nos offres</button>
        </div>
        <p className="ns-hero-note"><IconMapPin size={16} /> Choix du départ</p>
      </div>
    </section>
  );
}

/* ------------------------------- Services --------------------------------- */
const SERVICES = [
  { icon: IconHome, title: "Hébergement", text: "Des hôtels sélectionnés, proches des lieux saints." },
  { icon: IconPlane, title: "Transport", text: "Vols et transferts organisés depuis votre pays de départ." },
  { icon: IconUsers, title: "Accompagnement", text: "Une équipe présente à chaque étape de votre voyage." },
  { icon: IconClipboard, title: "Suivi personnalisé", text: "Un interlocuteur dédié, du premier échange au retour." },
];

function ServicesSection() {
  return (
    <section id="services" className="ns-section">
      <div className="ns-container">
        <SectionHeading eyebrow="Comment nous vous accompagnons" title="Une organisation pensée pour votre tranquillité" subtitle="Quatre piliers, pour ne penser à rien d'autre qu'à votre Omra." />
        <div className="ns-services-grid">
          {SERVICES.map((s) => (
            <div className="ns-service-card" key={s.title}>
              <span className="ns-service-icon"><s.icon size={22} /></span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Engagements -------------------------------- */
const ENGAGEMENTS = [
  { icon: IconShield, title: "Transparence", text: "Le contenu de chaque offre est indiqué clairement, avant toute demande." },
  { icon: IconUsers, title: "Exclusivité", text: "Une équipe dédiée uniquement à l'organisation de la Omra." },
  { icon: IconMoon, title: "Présence", text: "Un accompagnement humain, à chaque étape, jusqu'à votre retour." },
];

function EngagementsSection() {
  return (
    <section className="ns-section ns-section-dark">
      <div className="ns-container">
        <SectionHeading eyebrow="Nos engagements" title="Une conciergerie pensée pour votre tranquillité d'esprit" />
        <div className="ns-engage-grid">
          {ENGAGEMENTS.map((e) => (
            <div className="ns-engage-card" key={e.title}>
              <span className="ns-engage-icon"><e.icon size={21} /></span>
              <h3>{e.title}</h3>
              <p>{e.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Offers ----------------------------------- */
function OffersSection({ onPick }) {
  return (
    <section id="offres" className="ns-section">
      <div className="ns-container">
        <SectionHeading eyebrow="Nos offres" title="Deux formules, clairement distinctes" subtitle="Comparez en un coup d'œil ce qui est inclus dans chaque offre. Aucune option cachée." />

        <div className="ns-price-banner">
          <div className="ns-price-banner-icon"><IconPlane size={24} /></div>
          <div>
            <p className="ns-price-banner-title">Le prix du jour est votre prix, dès que vous réservez.</p>
            <p className="ns-price-banner-sub">Le tarif du vol évolue avec la demande à l'approche du départ. Réserver tôt, c'est la seule façon de garder ce tarif.</p>
          </div>
        </div>

        <div className="ns-departure-banner">
          <div className="ns-departure-top">
            <div className="ns-departure-when">
              <IconCalendar size={19} />
              {DEPARTURE ? (
                <span>Prochain départ groupé : <strong>{DEPARTURE.label}</strong></span>
              ) : (
                <span>Prochain départ : <strong>bientôt annoncé</strong></span>
              )}
            </div>
            {HOTELS.length > 0 && (
              <div className="ns-hotel-chips">
                {HOTELS.map((h) => (
                  <div className="ns-hotel-chip" key={h.city}>
                    <IconHome size={17} />
                    <span>
                      <span className="ns-hotel-chip-city">{h.city}</span>
                      <span className="ns-hotel-chip-name">{h.name} · {h.stars}★ · {h.nights} nuits ({h.dates})</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="ns-departure-min">
            <IconUsers size={16} />
            <span>Groupe de <strong>10 personnes minimum</strong> pour que ce départ soit maintenu</span>
          </div>
        </div>

        <OfferPicker value={null} onChange={() => {}} onAction={(key) => onPick(key)} />
      </div>
    </section>
  );
}

/* ---------------------------------- FAQ ------------------------------------- */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <section id="faq" className="ns-section ns-section-dim">
      <div className="ns-container">
        <SectionHeading eyebrow="Questions fréquentes" title="Tout ce qu'il faut savoir avant de commencer" />
        <div className="ns-faq-list">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div className={"ns-faq-item" + (isOpen ? " is-open" : "")} key={item.q}>
                <button type="button" className="ns-faq-q" onClick={() => setOpenIndex(isOpen ? null : i)} aria-expanded={isOpen}>
                  <span>{item.q}</span>
                  <IconChevronDown size={20} className="ns-chev" />
                </button>
                <div className="ns-faq-a">
                  <div className="ns-faq-a-inner">{item.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Contact ------------------------------------ */
function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSent(true);
    setForm({ name: "", email: "", message: "" });
  }

  const methods = [
    { icon: IconPhone, label: "Téléphone", value: CONTACT.phone, href: "tel:" + CONTACT.phone.replace(/\s/g, "") },
    { icon: IconWhatsapp, label: "WhatsApp", value: CONTACT.whatsapp, href: "https://wa.me/" + CONTACT.whatsapp.replace(/\D/g, "") + "?text=" + encodeURIComponent(WHATSAPP_PREFILL) },
    { icon: IconMail, label: "Email", value: CONTACT.email, href: "mailto:" + CONTACT.email },
    { icon: IconInstagram, label: "Instagram", value: CONTACT.instagram, href: "https://instagram.com/" + CONTACT.instagram.replace("@", "") },
    { icon: IconFacebook, label: "Facebook", value: CONTACT.facebook, href: "https://facebook.com/" + CONTACT.facebook.replace(/\s+/g, "") },
  ];

  return (
    <section id="contact" className="ns-section ns-section-dark">
      <div className="ns-container">
        <SectionHeading eyebrow="Contact" title="Une question ? Nous sommes là." subtitle="Contactez-nous directement, ou laissez-nous un message et nous vous répondrons rapidement." />
        <div className="ns-contact-grid">
          <div className="ns-contact-methods">
            {methods.map((m) => (
              <a className="ns-contact-method" href={m.href} key={m.label}>
                <span className="ns-contact-method-ico"><m.icon size={19} /></span>
                <span>
                  <span className="ns-contact-method-label" style={{ display: "block" }}>{m.label}</span>
                  <span className="ns-contact-method-value">{m.value}</span>
                </span>
              </a>
            ))}
          </div>
          <form className="ns-form" onSubmit={submit}>
            <div className="ns-field">
              <label htmlFor="c-name">Nom complet</label>
              <input id="c-name" className="ns-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Votre nom" />
            </div>
            <div className="ns-field">
              <label htmlFor="c-email">Email</label>
              <input id="c-email" type="email" className="ns-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.com" />
            </div>
            <div className="ns-field">
              <label htmlFor="c-msg">Message</label>
              <textarea id="c-msg" className="ns-textarea" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Comment pouvons-nous vous aider ?" />
            </div>
            <button type="submit" className="ns-btn ns-btn-primary">Envoyer le message</button>
            {sent && <div className="ns-form-success"><IconCheck size={18} />Message envoyé, nous vous répondrons rapidement.</div>}
          </form>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Footer ------------------------------------- */
/* ----------------------------- Floating WhatsApp ----------------------------- */
function FloatingWhatsapp() {
  return (
    <a
      href={"https://wa.me/" + CONTACT.whatsapp.replace(/\D/g, "") + "?text=" + encodeURIComponent(WHATSAPP_PREFILL)}
      className="ns-float-whatsapp"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter Noor Safar sur WhatsApp"
    >
      <IconWhatsapp size={26} />
    </a>
  );
}

function Footer({ onOpenAdmin }) {
  return (
    <footer className="ns-footer">
      <div className="ns-container">
        <div className="ns-footer-top">
          <div>
            <div className="ns-footer-brand">
              <img src={LOGO_SRC} alt="" />
              <span className="ns-footer-brand-name">Noor Safar</span>
            </div>
            <p className="ns-footer-desc">Conciergerie dédiée à l'organisation de la Omra, de votre premier échange jusqu'à votre retour.</p>
          </div>
          <div>
            <h4>Navigation</h4>
            <ul>
              <li><a href="#services">Services</a></li>
              <li><a href="#offres">Nos offres</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4>Offres</h4>
            <ul>
              <li><a href="#offres">Avec transport</a></li>
              <li><a href="#offres">Sans transport</a></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li><a href={"tel:" + CONTACT.phone.replace(/\s/g, "")}>{CONTACT.phone}</a></li>
              <li><a href={"mailto:" + CONTACT.email}>{CONTACT.email}</a></li>
              <li><a href="#contact">Formulaire de contact</a></li>
            </ul>
          </div>
        </div>
        <div className="ns-footer-bottom">
          <span>© {new Date().getFullYear()} Noor Safar. Tous droits réservés.</span>
          <button type="button" className="ns-footer-admin-link" onClick={onOpenAdmin}>Espace conciergerie</button>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------- Booking flow ---------------------------------- */
function StepDeparture({ draft, setDraft }) {
  return (
    <div>
      <h2 className="ns-flow-title">D'où partez-vous ?</h2>
      <p className="ns-flow-sub">Choisissez votre pays de départ. Nous adapterons les informations à votre situation.</p>
      <CountryPicker value={draft.country} onChange={(c) => setDraft({ ...draft, country: c })} />
    </div>
  );
}

function StepDate({ draft, setDraft }) {
  return (
    <div>
      <h2 className="ns-flow-title">Quelle est la date souhaitée ?</h2>
      <p className="ns-flow-sub">Indiquez la date à laquelle vous souhaitez effectuer votre Omra. Votre compte à rebours personnel s'affichera automatiquement.</p>
      <div className="ns-field" style={{ maxWidth: 280, marginBottom: "1.8rem" }}>
        <label htmlFor="omra-date">Date de la Omra</label>
        <input
          id="omra-date"
          type="date"
          className="ns-input"
          min={tomorrowISO()}
          value={draft.date}
          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
        />
      </div>
      {draft.date && <CountdownTicket country={draft.country} date={draft.date} />}
    </div>
  );
}

function StepOffer({ draft, setDraft }) {
  return (
    <div>
      <h2 className="ns-flow-title">Quelle formule choisissez-vous ?</h2>
      <p className="ns-flow-sub">Les deux offres sont détaillées ci-dessous. Aucune option n'est cachée dans l'autre.</p>
      <OfferPicker value={draft.offer} onChange={(key) => setDraft({ ...draft, offer: key })} />
    </div>
  );
}

function StepTravelers({ draft, setDraft, errors }) {
  const offer = draft.offer ? OFFERS[draft.offer] : null;
  const selectedPricing = offer ? offer.pricing.find((p) => p.key === draft.roomType) : null;
  const estimate = selectedPricing ? selectedPricing.price * draft.travelers : null;
  return (
    <div>
      <h2 className="ns-flow-title">Combien de personnes voyagent avec vous ?</h2>
      <p className="ns-flow-sub">Comptez-vous, ainsi que toutes les personnes qui vous accompagnent.</p>
      <div className="ns-stepper" role="group" aria-label="Nombre de voyageurs">
        <button type="button" onClick={() => setDraft({ ...draft, travelers: Math.max(1, draft.travelers - 1) })} disabled={draft.travelers <= 1} aria-label="Diminuer">
          <IconMinus size={16} />
        </button>
        <span className="ns-stepper-value">{draft.travelers}</span>
        <button type="button" onClick={() => setDraft({ ...draft, travelers: Math.min(20, draft.travelers + 1) })} disabled={draft.travelers >= 20} aria-label="Augmenter">
          <IconArrowRight size={16} style={{ transform: "rotate(-90deg)" }} />
        </button>
      </div>

      {offer && (
        <div style={{ marginTop: "2rem" }}>
          <div className="ns-field" style={{ marginBottom: ".9rem" }}>
            <label>Configuration de chambre souhaitée</label>
          </div>
          <RoomTypePicker offerKey={draft.offer} value={draft.roomType} onChange={(key) => setDraft({ ...draft, roomType: key })} />
          {errors && errors.roomType && <span className="ns-field-error">{errors.roomType}</span>}
          {estimate !== null && (
            <p className="ns-estimate-note">
              Estimation indicative : <strong>{estimate}€</strong> au total pour {draft.travelers} {draft.travelers > 1 ? "personnes" : "personne"} · tarif confirmé par notre équipe selon la disponibilité.
            </p>
          )}
        </div>
      )}

      <div className="ns-field" style={{ marginTop: "1.8rem" }}>
        <label htmlFor="group-notes">Précisions sur votre groupe (facultatif)</label>
        <textarea
          id="group-notes"
          className="ns-textarea"
          placeholder="Âges, besoins particuliers, personnes à mobilité réduite…"
          value={draft.groupNotes}
          onChange={(e) => setDraft({ ...draft, groupNotes: e.target.value })}
        />
      </div>
    </div>
  );
}

function StepContact({ draft, setDraft, errors }) {
  return (
    <div>
      <h2 className="ns-flow-title">Comment pouvons-nous vous recontacter ?</h2>
      <p className="ns-flow-sub">Notre équipe vous recontactera avec ces informations pour finaliser votre dossier.</p>
      <div className="ns-field" style={{ marginBottom: "1.1rem" }}>
        <label htmlFor="full-name">Nom complet</label>
        <input id="full-name" className="ns-input" value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} placeholder="Votre nom et prénom" />
        {errors.fullName && <span className="ns-field-error">{errors.fullName}</span>}
      </div>
      <div className="ns-field" style={{ marginBottom: "1.1rem" }}>
        <label htmlFor="phone">Téléphone</label>
        <input id="phone" className="ns-input" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Numéro joignable, idéalement WhatsApp" />
        {errors.phone && <span className="ns-field-error">{errors.phone}</span>}
      </div>
      <div className="ns-field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" className="ns-input" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="vous@exemple.com" />
        {errors.email && <span className="ns-field-error">{errors.email}</span>}
      </div>
    </div>
  );
}

function StepRecap({ draft, goToStep }) {
  const offer = draft.offer ? OFFERS[draft.offer] : null;
  const roomPricing = offer ? offer.pricing.find((p) => p.key === draft.roomType) : null;
  const estimate = roomPricing ? roomPricing.price * draft.travelers : null;
  const rows = [
    { label: "Pays de départ", value: draft.country ? draft.country.flag + " " + draft.country.label : "—", step: 1 },
    { label: "Date de la Omra", value: draft.date ? formatDateLong(draft.date) : "—", step: 2 },
    { label: "Offre choisie", value: offer ? offer.title : "—", step: 3 },
    { label: "Voyageurs", value: draft.travelers + (draft.travelers > 1 ? " personnes" : " personne"), step: 4 },
    { label: "Configuration de chambre", value: roomPricing ? "Chambre " + roomPricing.label + " · " + roomPricing.price + "€ / personne" : "—", step: 4 },
    { label: "Estimation indicative", value: estimate !== null ? estimate + "€ au total" : "—", step: 4 },
    { label: "Coordonnées", value: [draft.fullName, draft.phone, draft.email].filter(Boolean).join(" · ") || "—", step: 5 },
  ];
  return (
    <div>
      <h2 className="ns-flow-title">Récapitulatif de votre demande</h2>
      <p className="ns-flow-sub">Vérifiez les informations ci-dessous avant de confirmer votre demande.</p>
      {draft.date && <CountdownTicket country={draft.country} date={draft.date} />}
      <div className="ns-recap-card" style={{ marginTop: "1.8rem" }}>
        {rows.map((r) => (
          <div className="ns-recap-row" key={r.label}>
            <span>
              <span className="ns-recap-label" style={{ display: "block" }}>{r.label}</span>
              <span className="ns-recap-value">{r.value}</span>
            </span>
            <button type="button" className="ns-recap-edit" onClick={() => goToStep(r.step)}>Modifier</button>
          </div>
        ))}
      </div>
      {draft.groupNotes && (
        <div className="ns-recap-card">
          <div className="ns-recap-row">
            <span>
              <span className="ns-recap-label" style={{ display: "block" }}>Précisions sur le groupe</span>
              <span className="ns-recap-value" style={{ fontSize: "0.95rem" }}>{draft.groupNotes}</span>
            </span>
          </div>
        </div>
      )}
      <p className="ns-consent">
        <IconShield size={18} style={{ flexShrink: 0, marginTop: 2, color: "var(--gold-deep)" }} />
        En confirmant, vous acceptez d'être recontacté par notre équipe au sujet de votre demande de Omra.
      </p>
    </div>
  );
}

function BookingFlow({ draft, setDraft, onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const total = BOOKING_STEPS.length;

  function validateStep(current) {
    const e = {};
    if (current === 1 && !draft.country) e.country = "Choisissez un pays de départ.";
    if (current === 2 && !draft.date) e.date = "Choisissez une date.";
    if (current === 3 && !draft.offer) e.offer = "Choisissez une offre.";
    if (current === 4) {
      const offerData = draft.offer ? OFFERS[draft.offer] : null;
      const hasPricing = offerData && offerData.pricing && offerData.pricing.length > 0;
      if (hasPricing && !draft.roomType) e.roomType = "Choisissez une configuration de chambre.";
    }
    if (current === 5) {
      if (!draft.fullName.trim()) e.fullName = "Indiquez votre nom complet.";
      if (!draft.phone.trim()) e.phone = "Indiquez un numéro de téléphone.";
      if (!draft.email.trim() || !/^\S+@\S+\.\S+$/.test(draft.email)) e.email = "Indiquez un email valide.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validateStep(step)) return;
    if (step < total) setStep(step + 1);
  }
  function prev() {
    if (step > 1) setStep(step - 1);
  }
  function goToStep(n) {
    setStep(n);
  }

  async function confirm() {
    setSubmitting(true);
    const offerData = draft.offer ? OFFERS[draft.offer] : null;
    const roomPricing = offerData ? offerData.pricing.find((p) => p.key === draft.roomType) : null;
    const booking = {
      id: uid(),
      ref: generateRef(),
      submittedAt: new Date().toISOString(),
      status: "Nouvelle demande",
      country: draft.country,
      date: draft.date,
      offer: draft.offer,
      roomType: draft.roomType,
      pricePerPerson: roomPricing ? roomPricing.price : null,
      estimateTotal: roomPricing ? roomPricing.price * draft.travelers : null,
      travelers: draft.travelers,
      groupNotes: draft.groupNotes,
      fullName: draft.fullName,
      phone: draft.phone,
      email: draft.email,
    };
    const ok = await onSubmit(booking);
    setSubmitting(false);
    if (ok) setConfirmed(booking);
  }

  if (confirmed) {
    return (
      <div className="ns-flow">
        <div className="ns-flow-header">
          <div className="ns-container ns-flow-header-inner">
            <button type="button" className="ns-flow-close" onClick={onClose}><IconArrowLeft size={16} /> Retour au site</button>
          </div>
        </div>
        <div className="ns-flow-body">
          <div className="ns-success">
            <div className="ns-success-ico"><IconCheck size={34} /></div>
            <h2>Votre demande a été envoyée !</h2>
            <p>Notre équipe vous contactera sous peu par téléphone ou WhatsApp pour finaliser votre dossier. En attendant, gardez un œil sur le compte à rebours de votre Omra.</p>
            <span className="ns-success-ref">{confirmed.ref}</span>
            <CountdownTicket country={confirmed.country} date={confirmed.date} refCode={confirmed.ref} />
          </div>
          <div className="ns-flow-actions" style={{ justifyContent: "center" }}>
            <button type="button" className="ns-btn ns-btn-primary" onClick={onClose}>Retour à l'accueil</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ns-flow">
      <div className="ns-flow-header">
        <div className="ns-container ns-flow-header-inner">
          <button type="button" className="ns-flow-close" onClick={onClose}><IconX size={16} /> Retour au site</button>
          <span className="ns-flow-step-label">Étape {step}/{total} — {BOOKING_STEPS[step - 1]}</span>
        </div>
        <div className="ns-progress"><div className="ns-progress-bar" style={{ width: (step / total) * 100 + "%" }} /></div>
      </div>
      <div className="ns-flow-body">
        {step === 1 && <StepDeparture draft={draft} setDraft={setDraft} />}
        {step === 2 && <StepDate draft={draft} setDraft={setDraft} />}
        {step === 3 && <StepOffer draft={draft} setDraft={setDraft} />}
        {step === 4 && <StepTravelers draft={draft} setDraft={setDraft} errors={errors} />}
        {step === 5 && <StepContact draft={draft} setDraft={setDraft} errors={errors} />}
        {step === 6 && <StepRecap draft={draft} goToStep={goToStep} />}

        {(errors.country || errors.date || errors.offer) && (
          <p className="ns-field-error" style={{ marginTop: "1rem" }}>
            {errors.country || errors.date || errors.offer}
          </p>
        )}

        <div className="ns-flow-actions">
          {step > 1 ? (
            <button type="button" className="ns-btn ns-btn-secondary" onClick={prev}><IconArrowLeft size={16} /> Retour</button>
          ) : <span />}
          {step < total ? (
            <button type="button" className="ns-btn ns-btn-primary" onClick={next}>Continuer <IconArrowRight size={16} /></button>
          ) : (
            <button type="button" className="ns-btn ns-btn-primary" onClick={confirm} disabled={submitting}>
              {submitting ? <><IconLoader size={16} /> Envoi…</> : "Confirmer ma demande"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Admin --------------------------------------- */
function AdminView({ onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Toutes");
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const { data, error: dbError } = await supabase
        .from("bookings")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (dbError) throw dbError;
      setBookings((data || []).map(fromDbRow));
    } catch (e) {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    const updated = bookings.map((b) => (b.id === id ? { ...b, status } : b));
    setBookings(updated);
    try {
      const { error: dbError } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (dbError) throw dbError;
    } catch (e) {
      setError(true);
    }
  }

  const counts = useMemo(() => {
    const c = { Toutes: bookings.length };
    STATUS_LIST.forEach((s) => { c[s] = bookings.filter((b) => b.status === s).length; });
    return c;
  }, [bookings]);

  const filtered = filter === "Toutes" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="ns-admin">
      <div className="ns-admin-header">
        <div className="ns-container ns-admin-header-inner">
          <div className="ns-admin-title">
            <h1>Espace conciergerie</h1>
            <span>Demandes de Omra reçues via le site</span>
          </div>
          <button type="button" className="ns-btn ns-btn-secondary" onClick={onClose}><IconArrowLeft size={16} /> Retour au site</button>
        </div>
      </div>
      <div className="ns-container ns-admin-body">
        <p className="ns-admin-note">Aperçu de démonstration : les données sont stockées pour cet artefact et visibles par toute personne y ayant accès. À sécuriser (accès protégé, hébergement dédié) avant une mise en production réelle.</p>

        <div className="ns-admin-stat">
          <span className="ns-admin-stat-label">Pèlerins intéressés pour ce départ</span>
          <span className="ns-admin-stat-value">{bookings.length} / {GROUP_THRESHOLD}</span>
        </div>

        <div className="ns-admin-tabs" role="tablist" aria-label="Filtrer par statut">
          {["Toutes", ...STATUS_LIST].map((s) => (
            <button
              key={s}
              type="button"
              className={"ns-admin-tab" + (filter === s ? " is-active" : "")}
              onClick={() => setFilter(s)}
            >
              {s} {typeof counts[s] === "number" ? "(" + counts[s] + ")" : ""}
            </button>
          ))}
        </div>

        {loading && (
          <div className="ns-loading"><IconLoader size={20} /> Chargement des demandes…</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="ns-empty-state">
            <IconInbox size={40} />
            <p>{bookings.length === 0 ? "Aucune demande pour le moment. Les nouvelles demandes Omra apparaîtront ici automatiquement." : "Aucune demande pour ce statut."}</p>
          </div>
        )}

        {!loading && filtered.map((b) => {
          const offer = b.offer ? OFFERS[b.offer] : null;
          const isOpen = openId === b.id;
          const cd = computeCountdown(b.date);
          return (
            <div className="ns-booking-card" key={b.id}>
              <div className="ns-booking-card-top">
                <div>
                  <div className="ns-booking-ref">{b.ref}</div>
                  <div className="ns-booking-meta">Reçue le {formatDateShort(b.submittedAt)}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="ns-booking-grid">
                <div>
                  <div className="ns-booking-field-label">Client</div>
                  <div className="ns-booking-field-value">{b.fullName || "—"}</div>
                </div>
                <div>
                  <div className="ns-booking-field-label">Départ</div>
                  <div className="ns-booking-field-value">{b.country ? b.country.flag + " " + b.country.label : "—"}</div>
                </div>
                <div>
                  <div className="ns-booking-field-label">Date Omra</div>
                  <div className="ns-booking-field-value">{b.date ? formatDateLong(b.date) : "—"}{cd && !cd.past ? " · J-" + cd.days : ""}</div>
                </div>
                <div>
                  <div className="ns-booking-field-label">Voyageurs</div>
                  <div className="ns-booking-field-value">{b.travelers}</div>
                </div>
                <div>
                  <div className="ns-booking-field-label">Offre</div>
                  <div className="ns-booking-field-value">{offer ? offer.title : "—"}</div>
                </div>
                <div>
                  <div className="ns-booking-field-label">Chambre</div>
                  <div className="ns-booking-field-value">{b.roomType ? b.roomType.charAt(0).toUpperCase() + b.roomType.slice(1) : "—"}{b.pricePerPerson ? " · " + b.pricePerPerson + "€/pers." : ""}</div>
                </div>
                <div>
                  <div className="ns-booking-field-label">Estimation</div>
                  <div className="ns-booking-field-value">{b.estimateTotal ? b.estimateTotal + "€" : "—"}</div>
                </div>
                <div>
                  <div className="ns-booking-field-label">Téléphone</div>
                  <div className="ns-booking-field-value">{b.phone || "—"}</div>
                </div>
                <div>
                  <div className="ns-booking-field-label">Email</div>
                  <div className="ns-booking-field-value">{b.email || "—"}</div>
                </div>
              </div>

              <div className="ns-status-row">
                <label htmlFor={"status-" + b.id} className="ns-booking-field-label">Statut :</label>
                <select
                  id={"status-" + b.id}
                  className="ns-select ns-status-select"
                  value={b.status}
                  onChange={(e) => updateStatus(b.id, e.target.value)}
                >
                  {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {b.groupNotes && (
                <button type="button" className="ns-booking-details-toggle" onClick={() => setOpenId(isOpen ? null : b.id)}>
                  <IconChevronDown size={16} style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
                  {isOpen ? "Masquer les détails" : "Voir les détails"}
                </button>
              )}
              {isOpen && b.groupNotes && (
                <div className="ns-booking-details">
                  <div><span className="ns-booking-field-label">Précisions sur le groupe : </span>{b.groupNotes}</div>
                </div>
              )}
            </div>
          );
        })}

        {error && <p className="ns-field-error">La mise à jour n'a pas pu être enregistrée. Réessayez.</p>}
      </div>
    </div>
  );
}

/* ----------------------------------- App ------------------------------------------ */
export default function App() {
  const [view, setView] = useState("site");
  const [draft, setDraft] = useState(emptyDraft());
  const topRef = useRef(null);

  function startBooking(partial) {
    setDraft({ ...emptyDraft(), ...(partial || {}) });
    setView("booking");
  }

  function discover() {
    const el = document.getElementById("offres");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSubmitBooking(booking) {
    try {
      const { error: dbError } = await supabase.from("bookings").insert([toDbRow(booking)]);
      if (dbError) throw dbError;
      return true;
    } catch (e) {
      return false;
    }
  }

  useEffect(() => {
    if (view !== "site" && topRef.current) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [view]);

  return (
    <div ref={topRef}>
      <GlobalStyles />
      <div className="ns-app">
        {view === "site" && (
          <>
            <Nav onStartBooking={() => startBooking({})} />
            <Hero onStartBooking={() => startBooking({})} onDiscover={discover} />
            <ServicesSection />
            <EngagementsSection />
            <OffersSection onPick={(key) => startBooking({ offer: key })} />
            <FAQSection />
            <ContactSection />
            <Footer onOpenAdmin={() => setView("admin")} />
            <FloatingWhatsapp />
          </>
        )}
        {view === "booking" && (
          <BookingFlow
            draft={draft}
            setDraft={setDraft}
            onClose={() => setView("site")}
            onSubmit={handleSubmitBooking}
          />
        )}
        {view === "admin" && <AdminView onClose={() => setView("site")} />}
      </div>
    </div>
  );
}
