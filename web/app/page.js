"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { INDICATORS } from "../lib/indicators";

const COLOR_A = "#2563eb"; // azul
const COLOR_B = "#f97316"; // naranja

export default function Home() {
  const [countryList, setCountryList] = useState([]);
  const [codeA, setCodeA] = useState("");
  const [codeB, setCodeB] = useState("");
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);

  // Cargar la lista liviana de países una sola vez, al entrar a la página
  useEffect(() => {
    fetch("/api/countries")
      .then((res) => res.json())
      .then((list) => {
        setCountryList(list);
        // valores por defecto para que se vea algo apenas entras
        if (list.length > 1) {
          const arg = list.find((c) => c.iso3 === "ARG");
          const esp = list.find((c) => c.iso3 === "ESP");
          setCodeA(arg ? arg.iso3 : list[0].iso3);
          setCodeB(esp ? esp.iso3 : list[1].iso3);
        }
      });
  }, []);

  // Cada vez que cambia el país A, traer todos sus datos
  useEffect(() => {
    if (!codeA) return;
    fetch(`/api/countries?code=${codeA}`)
      .then((res) => res.json())
      .then(setDataA);
  }, [codeA]);

  // Lo mismo para el país B
  useEffect(() => {
    if (!codeB) return;
    fetch(`/api/countries?code=${codeB}`)
      .then((res) => res.json())
      .then(setDataB);
  }, [codeB]);

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Comparar países</h1>

      <div className="flex gap-4 mb-8">
        <select
          value={codeA}
          onChange={(e) => setCodeA(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        >
          {countryList.map((c) => (
            <option key={c.iso3} value={c.iso3}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={codeB}
          onChange={(e) => setCodeB(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        >
          {countryList.map((c) => (
            <option key={c.iso3} value={c.iso3}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {dataA && dataB ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDICATORS.map((ind) => {
            const valueA = Number(dataA[ind.key]) || 0;
            const valueB = Number(dataB[ind.key]) || 0;
            const chartData = [
              { name: dataA.name, value: valueA },
              { name: dataB.name, value: valueB },
            ];

            return (
              <div key={ind.key} className="border rounded-lg p-4">
                <h2 className="font-semibold mb-2">
                  {ind.label} {ind.unit && `(${ind.unit})`}
                </h2>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={90} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      <Cell fill={COLOR_A} />
                      <Cell fill={COLOR_B} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500">Elegí dos países para comparar.</p>
      )}
    </main>
  );
}
