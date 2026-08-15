import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

// GET /api/countries          -> top 10 países por población
// GET /api/countries?code=ARG -> un país específico por su código ISO3
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  let query = supabase.from("countries").select("*");

  if (code) {
    query = query.eq("iso3", code.toUpperCase());
  } else {
    query = query.order("population", { ascending: false }).limit(10);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
