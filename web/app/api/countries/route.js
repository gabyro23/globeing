import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

// GET /api/countries -> todos los países, con todos sus datos.
// Son ~190 filas livianas: la cargamos entera una vez y filtramos/ordenamos
// del lado del cliente (igual que hacía el prototipo original con su JSON estático).
export async function GET() {
  const { data, error } = await supabase.from("countries").select("*").order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
