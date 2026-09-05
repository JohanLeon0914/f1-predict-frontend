export function getOpenF1Headers() {
  const token = process.env.OPENF1_API_TOKEN ?? process.env.OPENF1_ACCESS_TOKEN;

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "User-Agent": "F1MLPredicts/0.1.0 NextJS",
  };
}
