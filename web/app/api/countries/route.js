import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

// GET /api/countries -> all countries, with all of their data.
// It's ~190 lightweight rows: we load the whole thing once and
// filter/sort client-side (same as the original prototype did with its
// static JSON).
export async function GET() {
  const { data, error } = await supabase.from("countries").select("*").order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
