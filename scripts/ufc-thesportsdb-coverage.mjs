const BASE_URL = "https://www.thesportsdb.com/api/v1/json/123";

const fighters = [
  "Ilia Topuria",
  "Alexander Volkanovski",
  "Islam Makhachev",
  "Charles Oliveira",
  "Max Holloway",
  "Alex Pereira",
  "Jon Jones",
  "Tom Aspinall",
  "Dricus Du Plessis",
  "Sean O'Malley",
  "Khamzat Chimaev",
  "Justin Gaethje",
  "Dustin Poirier",
  "Paddy Pimblett",
  "Merab Dvalishvili",
  "Valentina Shevchenko",
  "Zhang Weili",
  "Amanda Nunes",
  "Brandon Moreno",
  "Alexandre Pantoja",
];

const imageFields = [
  "strThumb",
  "strCutout",
  "strRender",
  "strFanart1",
  "strFanart2",
  "strFanart3",
  "strFanart4",
  "strBanner",
  "strPoster",
  "strSquare",
];

const metadataPatterns = [
  /creative/i,
  /commons/i,
  /copyright/i,
  /attribution/i,
  /source/i,
  /author/i,
  /license/i,
  /licence/i,
  /^strCreativeCommons$/i,
];

function normalizeFighterName(name) {
  return name.trim().replace(/\s+/g, "_");
}

function markdownEscape(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .trim();
}

function getImageEntries(player) {
  return imageFields
    .map((field) => [field, player?.[field]])
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0);
}

function getLicenseMetadata(player) {
  return Object.entries(player ?? {}).filter(([field, value]) => {
    if (value == null || value === "") return false;
    return metadataPatterns.some((pattern) => pattern.test(field) || pattern.test(String(value)));
  });
}

function isLikelyPortrait(field, url) {
  const lowerUrl = String(url).toLowerCase();
  if (field === "strCutout" || field === "strThumb" || field === "strRender") return true;
  return /player|thumb|cutout|render|portrait|headshot/.test(lowerUrl);
}

function chooseBestImage(entries) {
  const preferred = ["strCutout", "strThumb", "strRender", "strSquare", "strPoster"];
  return (
    preferred
      .map((field) => entries.find(([entryField]) => entryField === field))
      .find(Boolean) ?? entries[0] ?? null
  );
}

function chooseBestPlayer(players, originalName) {
  if (!Array.isArray(players) || players.length === 0) return null;
  const target = originalName.toLowerCase();
  return (
    players.find((player) => String(player.strPlayer ?? "").toLowerCase() === target) ??
    players.find((player) => String(player.strSport ?? "").toLowerCase().includes("fighting")) ??
    players.find((player) => String(player.strSport ?? "").toLowerCase().includes("mma")) ??
    players[0]
  );
}

async function fetchFighter(originalName) {
  const queryName = normalizeFighterName(originalName);
  const url = `${BASE_URL}/searchplayers.php?p=${encodeURIComponent(queryName)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const player = chooseBestPlayer(payload.player, originalName);
  const images = getImageEntries(player);
  const bestImage = chooseBestImage(images);
  const licenseMetadata = getLicenseMetadata(player);

  return {
    bestImageField: bestImage?.[0] ?? "",
    bestImageUrl: bestImage?.[1] ?? "",
    creativeCommons: licenseMetadata.length > 0,
    found: Boolean(player),
    idPlayer: player?.idPlayer ?? "",
    imageFieldsAvailable: images.map(([field]) => field),
    licenseMetadata,
    originalName,
    playerName: player?.strPlayer ?? "",
    queryName,
    rawPlayer: player,
    usablePortrait: bestImage ? isLikelyPortrait(bestImage[0], bestImage[1]) : false,
  };
}

function printReport(results) {
  const total = results.length;
  const found = results.filter((result) => result.found).length;
  const withImage = results.filter((result) => result.bestImageUrl).length;
  const usable = results.filter((result) => result.usablePortrait).length;
  const fieldCounts = new Map();

  for (const result of results) {
    for (const field of result.imageFieldsAvailable) {
      fieldCounts.set(field, (fieldCounts.get(field) ?? 0) + 1);
    }
  }

  const commonFields = [...fieldCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([field, count]) => `${field}: ${count}`)
    .join(", ");

  console.log("## Fighter | Found | Image | Image Field | Creative Commons | Image URL");
  console.log("| Fighter | Found | Image | Image Field | Creative Commons | Image URL | Error |");
  console.log("|---|---:|---:|---|---:|---|---|");
  for (const result of results) {
    console.log(
      `| ${markdownEscape(result.originalName)} | ${result.found ? "Yes" : "No"} | ${
        result.bestImageUrl ? "Yes" : "No"
      } | ${markdownEscape(result.bestImageField || "-")} | ${
        result.creativeCommons ? "Yes" : "No"
      } | ${markdownEscape(result.bestImageUrl || "-")} | ${markdownEscape(result.error || "-")} |`,
    );
  }

  console.log("\n## Summary");
  console.log(`Total fighters consulted: ${total}`);
  console.log(`Found: ${found}/${total} (${((found / total) * 100).toFixed(1)}%)`);
  console.log(`With image: ${withImage}/${total} (${((withImage / total) * 100).toFixed(1)}%)`);
  console.log(
    `Likely usable portrait/headshot: ${usable}/${total} (${((usable / total) * 100).toFixed(1)}%)`,
  );
  console.log(`Most common image fields: ${commonFields || "None"}`);

  console.log("\n## License / Source Metadata");
  for (const result of results) {
    const metadata = result.licenseMetadata
      .map(([field, value]) => `${field}=${String(value).slice(0, 180)}`)
      .join("; ");
    console.log(`- ${result.originalName}: ${metadata || "No explicit license/source metadata fields found"}`);
  }

  console.log("\n## Available Image Fields");
  for (const result of results) {
    console.log(
      `- ${result.originalName}: ${result.imageFieldsAvailable.length ? result.imageFieldsAvailable.join(", ") : "None"}`,
    );
  }
}

const results = [];

for (const fighter of fighters) {
  try {
    results.push(await fetchFighter(fighter));
  } catch (error) {
    results.push({
      bestImageField: "",
      bestImageUrl: "",
      creativeCommons: false,
      error: error instanceof Error ? error.message : String(error),
      found: false,
      idPlayer: "",
      imageFieldsAvailable: [],
      licenseMetadata: [],
      originalName: fighter,
      playerName: "",
      queryName: normalizeFighterName(fighter),
      rawPlayer: null,
      usablePortrait: false,
    });
  }
}

printReport(results);

if (results.some((result) => result.error)) {
  process.exitCode = 1;
}
