export type AnalysisStatus = "pre-race" | "post-race";

export type AnalysisKeyFactor = {
  title: string;
  detail: string;
};

export type AnalysisPredictionRow = {
  driver: string;
  team: string;
  predictedPosition: number;
  actualPosition?: number | null;
  positionError?: number | null;
  note?: string;
};

export type AnalysisRecord = {
  slug: string;
  season: number;
  round: number;
  raceName: string;
  title: string;
  date: string;
  circuitName: string;
  circuitRef: string;
  country: string;
  status: AnalysisStatus;
  summary: string;
  modelAnalysis: string[];
  keyFactors: AnalysisKeyFactor[];
  predictionRows: AnalysisPredictionRow[];
  resultSummary: string;
  publishedNote: string;
  updatedAt?: string;
};

function parseUtcDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function getAnalysisStatus(date: string, referenceDate = new Date()): AnalysisStatus {
  const raceEnd = new Date(parseUtcDate(date).getTime() + 24 * 60 * 60 * 1000);
  return referenceDate >= raceEnd ? "post-race" : "pre-race";
}

type Profile = Pick<
  AnalysisRecord,
  "summary" | "modelAnalysis" | "keyFactors" | "resultSummary" | "publishedNote"
>;

const profiles: Record<string, Profile> = {
  monza: {
    summary:
      "Monza is a low-downforce weekend where straight-line speed, braking confidence, and clean exits decide a lot of the story.",
    modelAnalysis: [
      "GRDX1 leans on qualifying pace here because track position matters more when the field spends long stretches tucked into DRS trains.",
      "The model gives extra weight to braking stability into the chicanes and the ability to keep the rear calm under heavy deceleration.",
      "Constructor efficiency matters more than usual because the lap rewards top speed without asking the car to waste grip in slower corners.",
    ],
    keyFactors: [
      { title: "Qualifying edge", detail: "One clean lap can change the whole weekend at Monza." },
      { title: "Top speed", detail: "The long straights keep power unit efficiency front and center." },
      { title: "Brake confidence", detail: "Chicanes punish cars that are nervous under braking." },
    ],
    resultSummary:
      "Once the race is complete, this page can compare the published prediction against the actual Monza finish and calculate the position error row by row.",
    publishedNote:
      "This is a pre-race analysis preview. GRDX1 will publish a prediction ranking here once the model run is finalized.",
  },
  madring: {
    summary:
      "Madring is a new reference point on the calendar, so GRDX1 treats it as a track where adaptability matters as much as raw historical form.",
    modelAnalysis: [
      "With less historical data, the model leans harder on current driver form, setup flexibility, and the team’s ability to react quickly across the weekend.",
      "New circuits usually reward drivers who build speed quickly without overdriving the car in the opening sessions.",
      "Because the layout is still unfamiliar, the analysis stays cautious and avoids pretending the numbers are more certain than they really are.",
    ],
    keyFactors: [
      { title: "Fast learning curve", detail: "The strongest weekends often come from drivers who settle in quickly." },
      { title: "Setup range", detail: "Teams need a car that stays usable while the track evolves." },
      { title: "Execution", detail: "Clean sessions matter when the usual reference points are limited." },
    ],
    resultSummary:
      "When race data becomes available, this page can show how GRDX1 handled a brand-new circuit and how well the model adapted.",
    publishedNote:
      "This is a pre-race analysis preview. GRDX1 will publish a prediction ranking here once the model run is finalized.",
  },
  baku: {
    summary:
      "Baku mixes long straights with a tight street circuit, so the model has to balance top speed with the kind of precision that keeps a car out of the walls.",
    modelAnalysis: [
      "Street-circuit volatility matters here because safety cars and restart timing can reshape the entire order.",
      "The narrow castle section rewards drivers who stay disciplined over confidence and avoid losing time in the slowest part of the lap.",
      "Straight-line speed still matters, but the model cannot ignore the need for a stable rear end through the tighter sections.",
    ],
    keyFactors: [
      { title: "Street-circuit risk", detail: "The model watches for race chaos and how teams react to it." },
      { title: "Slow-section control", detail: "The castle section punishes even small mistakes." },
      { title: "Restart strength", detail: "Baku can turn on one restart, not just raw pace." },
    ],
    resultSummary:
      "If the race is updated after the flag, this section can compare the pre-race model view with the actual Baku finish.",
    publishedNote:
      "This is a pre-race analysis preview. GRDX1 will publish a prediction ranking here once the model run is finalized.",
  },
  marina_bay: {
    summary:
      "Singapore is one of the hardest races on the calendar for both driver and machine, so the model leans into consistency, tire control, and clean execution.",
    modelAnalysis: [
      "Night-race conditions and wall pressure make small mistakes expensive, which is why the model values control over raw aggression.",
      "Tire management is especially important here because long, intense stints can punish drivers who overwork the front or rear axle.",
      "Qualifying still matters, but the race often rewards the driver and team that keep the full weekend clean rather than the one that just flashes one fast lap.",
    ],
    keyFactors: [
      { title: "Tire management", detail: "Singapore rewards the drivers who keep the tires alive." },
      { title: "Precision", detail: "The street walls keep the margin for error tiny." },
      { title: "Heat and rhythm", detail: "The model values calm, repeatable pace over spikes." },
    ],
    resultSummary:
      "After the race, this page can be updated to compare the published GRDX1 prediction against the Singapore result.",
    publishedNote:
      "This is a pre-race analysis preview. GRDX1 will publish a prediction ranking here once the model run is finalized.",
  },
  americas: {
    summary:
      "COTA asks for a car that can breathe in several different corner types, so GRDX1 reads it as a balance test rather than a one-note speed trap.",
    modelAnalysis: [
      "The model weighs how well a package changes direction through the flowing middle sector and how stable it stays under traction demand.",
      "Because the lap contains a little bit of everything, broad car balance often matters more than a single standout strength.",
      "Driver adaptability has a bigger role here than on a pure power circuit, especially when the weekend keeps shifting between sessions.",
    ],
    keyFactors: [
      { title: "Corner variety", detail: "The track rewards a car that can do a bit of everything." },
      { title: "Traction", detail: "Low-speed exits still matter even on a fast lap." },
      { title: "Adaptability", detail: "The best weekends usually come from the broadest setup window." },
    ],
    resultSummary:
      "This page can later show whether the model’s COTA read matched the actual finishing order.",
    publishedNote:
      "This is a pre-race analysis preview. GRDX1 will publish a prediction ranking here once the model run is finalized.",
  },
  rodriguez: {
    summary:
      "Mexico City brings altitude into the conversation, so the model has to think about cooling, drag, and how well the car stays alive over a longer stint picture.",
    modelAnalysis: [
      "Thin air changes the way a car behaves, which makes setup decisions and power-unit handling feel more important than on a normal weekend.",
      "Drivers who keep their rhythm through the lower-grip sections can create a cleaner weekend than a faster car that never settles into the conditions.",
      "The prediction engine keeps an eye on race-day consistency because the circuit can reward the team that manages the weekend rather than the one that peaks once.",
    ],
    keyFactors: [
      { title: "Altitude", detail: "Air density changes the whole weekend picture." },
      { title: "Cooling margin", detail: "Cars that manage heat better can stay in the fight longer." },
      { title: "Stint control", detail: "The model values the teams that keep the race plan tidy." },
    ],
    resultSummary:
      "Once the checkered flag has fallen, this page can become a direct prediction-versus-result recap for Mexico City.",
    publishedNote:
      "This is a pre-race analysis preview. GRDX1 will publish a prediction ranking here once the model run is finalized.",
  },
  interlagos: {
    summary:
      "Interlagos is rarely a quiet race, so GRDX1 treats it as a place where the model has to respect weather shifts, elevation changes, and race-day swing.",
    modelAnalysis: [
      "The model gives extra room to adaptability because this is the kind of weekend that can change quickly from one stint to the next.",
      "Interlagos tends to expose cars that are good in one phase of the lap but awkward in another, so the analysis prefers balance over a single flash point.",
      "Driver form matters, but the race often rewards the side that keeps reacting well when the conditions change.",
    ],
    keyFactors: [
      { title: "Weather swing", detail: "Interlagos can change the conversation very quickly." },
      { title: "Rhythm", detail: "A driver who settles in early can keep control of the weekend." },
      { title: "Balance", detail: "The model likes a package that stays useful across the whole lap." },
    ],
    resultSummary:
      "This page can later show how the published GRDX1 prediction stacked up against the actual Brazilian Grand Prix result.",
    publishedNote:
      "This is a pre-race analysis preview. GRDX1 will publish a prediction ranking here once the model run is finalized.",
  },
  vegas: {
    summary:
      "Las Vegas rewards speed on the straights but still demands control in the braking zones, and the cooler night conditions add their own layer of unpredictability.",
    modelAnalysis: [
      "The model pays close attention to grip window and tire warm-up because cold conditions can make early laps and restarts feel very different from the rest of the race.",
      "Street-track precision still matters, but the long full-throttle sections mean top speed cannot be ignored.",
      "Vegas is a weekend where execution and timing can matter as much as pure pace, especially when traffic bunches the field up.",
    ],
    keyFactors: [
      { title: "Cold grip window", detail: "Cold track conditions can change how the car comes alive." },
      { title: "Straight-line speed", detail: "The long runs down the strip keep engine efficiency relevant." },
      { title: "Traffic control", detail: "The field can bunch up quickly, so timing matters." },
    ],
    resultSummary:
      "After the race, this page can turn into a clean before-and-after comparison of GRDX1’s Vegas prediction.",
    publishedNote:
      "This is a pre-race analysis preview. GRDX1 will publish a prediction ranking here once the model run is finalized.",
  },
  losail: {
    summary:
      "Qatar is a fast, flowing circuit that puts tire stress and rhythm under the spotlight, which makes it a strong test of sustained pace.",
    modelAnalysis: [
      "The model likes discipline here because the lap rewards drivers who stay smooth and keep the tires in a usable window.",
      "High-speed direction changes can separate a confident package from one that looks quick on paper but struggles over a stint.",
      "The analysis gives weight to constructor form and repeated execution because there is less room to recover from a bad weekend.",
    ],
    keyFactors: [
      { title: "Tire stress", detail: "Long, fast turns make tire management part of the core story." },
      { title: "Stint rhythm", detail: "Consistency over a run matters more than one standout lap." },
      { title: "Package stability", detail: "A car that feels planted can keep the model happy here." },
    ],
    resultSummary:
      "If the page is revisited after the race, it can display how the model’s Qatar forecast held up against the finish.",
    publishedNote:
      "This is a pre-race analysis preview. GRDX1 will publish a prediction ranking here once the model run is finalized.",
  },
  yas_marina: {
    summary:
      "Yas Marina is a more balanced finishing stop, so GRDX1 reads it as a weekend where strong execution and late-race control can matter more than one wild headline lap.",
    modelAnalysis: [
      "The model likes a stable car here because the lap rewards smooth transitions and measured throttle use through the traction zones.",
      "As a season finale type of circuit, the weekend often comes down to how well teams keep pressure low and convert clean opportunities.",
      "The analysis stays focused on consistency because Yas Marina can punish a car that is only good in one part of the lap.",
    ],
    keyFactors: [
      { title: "Traction", detail: "The exits matter a lot when the lap is this composed." },
      { title: "Late-race control", detail: "The final stints can still decide the shape of the result." },
      { title: "Consistency", detail: "The model prefers a car that stays usable everywhere." },
    ],
    resultSummary:
      "This page can later flip into a result-comparison view once the race has been run and the data is final.",
    publishedNote:
      "This is a pre-race analysis preview. GRDX1 will publish a prediction ranking here once the model run is finalized.",
  },
};

const analysisOrder = [
  { slug: "italian-grand-prix-2026", season: 2026, round: 13, raceName: "Italian Grand Prix", date: "2026-09-06", circuitName: "Autodromo Nazionale di Monza", circuitRef: "monza", country: "Italy" },
  { slug: "spanish-grand-prix-2026", season: 2026, round: 14, raceName: "Spanish Grand Prix", date: "2026-09-13", circuitName: "Madring", circuitRef: "madring", country: "Spain" },
  { slug: "azerbaijan-grand-prix-2026", season: 2026, round: 15, raceName: "Azerbaijan Grand Prix", date: "2026-09-26", circuitName: "Baku City Circuit", circuitRef: "baku", country: "Azerbaijan" },
  { slug: "singapore-grand-prix-2026", season: 2026, round: 16, raceName: "Singapore Grand Prix", date: "2026-10-11", circuitName: "Marina Bay Street Circuit", circuitRef: "marina_bay", country: "Singapore" },
  { slug: "united-states-grand-prix-2026", season: 2026, round: 17, raceName: "United States Grand Prix", date: "2026-10-25", circuitName: "Circuit of the Americas", circuitRef: "americas", country: "United States" },
  { slug: "mexico-city-grand-prix-2026", season: 2026, round: 18, raceName: "Mexico City Grand Prix", date: "2026-11-01", circuitName: "Autódromo Hermanos Rodríguez", circuitRef: "rodriguez", country: "Mexico" },
  { slug: "brazilian-grand-prix-2026", season: 2026, round: 19, raceName: "Brazilian Grand Prix", date: "2026-11-08", circuitName: "Autódromo José Carlos Pace", circuitRef: "interlagos", country: "Brazil" },
  { slug: "las-vegas-grand-prix-2026", season: 2026, round: 20, raceName: "Las Vegas Grand Prix", date: "2026-11-22", circuitName: "Las Vegas Strip Street Circuit", circuitRef: "vegas", country: "United States" },
  { slug: "qatar-grand-prix-2026", season: 2026, round: 21, raceName: "Qatar Grand Prix", date: "2026-11-29", circuitName: "Losail International Circuit", circuitRef: "losail", country: "Qatar" },
  { slug: "abu-dhabi-grand-prix-2026", season: 2026, round: 22, raceName: "Abu Dhabi Grand Prix", date: "2026-12-06", circuitName: "Yas Marina Circuit", circuitRef: "yas_marina", country: "UAE" },
] as const;

function buildAnalysisRecord(entry: (typeof analysisOrder)[number], referenceDate = new Date()): AnalysisRecord {
  const profile = profiles[entry.circuitRef] ?? {
    summary: `${entry.raceName} is a useful data point for GRDX1 because it lets the model compare circuit context, driver form, and weekend execution in one place.`,
    modelAnalysis: [
      "The model watches for clean execution, strong race pace, and the ability to turn race-weekend signals into a stable prediction.",
      "This page is built so a published ranking can slot in later without changing the structure of the analysis.",
      "When more race-specific evidence is available, GRDX1 can replace this preview with a post-race comparison and actual result notes.",
    ],
    keyFactors: [
      { title: "Driver form", detail: "Recent performance is one of the first things the model checks." },
      { title: "Constructor pace", detail: "Team strength can matter as much as the driver on the right weekend." },
      { title: "Circuit fit", detail: "The track shape influences how the model weighs each signal." },
    ],
    resultSummary:
      "Once this race has an actual result, GRDX1 can update the same page instead of creating a separate recap.",
    publishedNote:
      "This is a pre-race analysis preview. GRDX1 will publish a prediction ranking here once the model run is finalized.",
  };

  return {
    ...entry,
    title: `${entry.raceName} ${entry.season} Prediction & Analysis | GRDX1`,
    status: getAnalysisStatus(entry.date, referenceDate),
    summary: profile.summary,
    modelAnalysis: profile.modelAnalysis,
    keyFactors: profile.keyFactors,
    predictionRows: [],
    resultSummary: profile.resultSummary,
    publishedNote: profile.publishedNote,
  };
}

export function getAnalysisEntries(referenceDate = new Date()) {
  return analysisOrder.map((entry) => buildAnalysisRecord(entry, referenceDate));
}

export function getAnalysisEntry(slug: string, referenceDate = new Date()) {
  return buildAnalysisEntryBySlug(slug, referenceDate);
}

export function getAnalysisPaths() {
  return analysisOrder.map((entry) => ({
    slug: entry.slug,
  }));
}

function buildAnalysisEntryBySlug(slug: string, referenceDate = new Date()) {
  const entry = analysisOrder.find((item) => item.slug === slug);
  return entry ? buildAnalysisRecord(entry, referenceDate) : null;
}
