import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

// GET /api/countries          -> lista liviana de TODOS los países (iso3 + name), para llenar los selectores
// GET /api/countries?code=ARG -> todos los datos de un país específico
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const { data, error } = await supabase
      .from("countries")
      .select("*")
      .eq("iso3", code.toUpperCase())
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("countries")
    .select("iso3, name")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
