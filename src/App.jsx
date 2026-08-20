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
