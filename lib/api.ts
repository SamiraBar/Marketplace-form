export async function createNomenclature(payload: Record<string, unknown>) {
  const token = process.env.NEXT_PUBLIC_TABLECRM_TOKEN;
  if (!token) throw new Error("TABLECRM_TOKEN не задан в переменных окружения");

  const res = await fetch(
    `https://app.tablecrm.com/api/v1/nomenclature/?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([payload]),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка API (${res.status}): ${text}`);
  }

  return res.json();
}
