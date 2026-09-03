export type ParticipantRequest = {
  driverId: number;
  constructorId: number;
  grid: number | null;
  qualifying_position: number | null;
  q1: string | number | null;
  q2: string | number | null;
  q3: string | number | null;
};

export type PredictionRequest = {
  race_id: number;
  circuit_id: number;
  race_date?: string | null;
  participants: ParticipantRequest[];
};

export type PredictionItem = {
  predicted_position: number;
  driverId: number;
  constructorId?: number;
  score: number;
  dashboard_stats?: PredictionDashboardStats;
  top_contributions?: PredictionContribution[];
  analysis?: PredictionAnalysis;
};

export type PredictionResponse = {
  race_date?: string | null;
  dashboard_analysis?: PredictionDashboardAnalysis;
  analysis_summary?: PredictionAnalysisSummary;
  race_id?: number;
  circuit_id?: number;
  predictions: PredictionItem[];
};

export type PredictionDashboardAnalysis = {
  top_3?: PredictionDashboardGroup;
  top_5?: PredictionDashboardGroup;
  top_10?: PredictionDashboardGroup;
  all_drivers?: PredictionDashboardGroup;
};

export type PredictionDashboardGroup = {
  label: string;
  requested_size: number;
  actual_size: number;
  drivers: PredictionDashboardDriver[];
  score_summary?: Partial<Record<"average" | "min" | "max" | "spread", number>>;
  shared_top_contributions?: PredictionSharedContribution[];
  feature_group_averages?: Record<string, Record<string, number | string | null>>;
};

export type PredictionDashboardStats = {
  starting_position?: Record<string, number | string | null>;
  driver_form?: Record<string, number | string | null>;
  driver_circuit_history?: Record<string, number | string | null>;
  constructor_form?: Record<string, number | string | null>;
  constructor_circuit_fit?: Record<string, number | string | null>;
  constructor_pair?: Record<string, number | string | null>;
  circuit_profile?: Record<string, number | string | null>;
  [key: string]: Record<string, number | string | null> | undefined;
};

export type PredictionContribution = {
  feature: string;
  contribution: number;
  abs_contribution: number;
  direction: "up" | "down" | string;
};

export type PredictionSharedContribution = {
  feature: string;
  mean_contribution: number;
  total_contribution: number;
  abs_mean_contribution: number;
  direction: "up" | "down" | string;
};

export type PredictionDashboardDriver = Pick<
  PredictionItem,
  "predicted_position" | "driverId" | "constructorId" | "score" | "analysis"
> & {
  dashboard_stats?: PredictionDashboardStats;
  top_contributions?: PredictionContribution[];
};

export type ModelMetricSplit = {
  ndcg?: number;
  spearman?: number;
  mae_position?: number;
  top1_accuracy?: number;
  top3_accuracy?: number;
  top10_accuracy?: number;
  [key: string]: number | undefined;
};

export type PredictionAnalysisSummary = {
  participant_count: number;
  model_output_note?: string;
  explanation_note?: string;
  available_feature_groups?: string[];
  global_feature_importance?: Array<{
    feature: string;
    importance: number;
    importance_pct: number;
  }>;
  model_metrics?: {
    validation?: ModelMetricSplit;
    test?: ModelMetricSplit;
  };
};

export type PredictionAnalysis = {
  feature_groups?: {
    starting_position?: Record<string, number | string | null>;
    driver_form?: Record<string, number | string | null>;
    driver_circuit_history?: Record<string, number | string | null>;
    constructor_form?: Record<string, number | string | null>;
    constructor_circuit_fit?: Record<string, number | string | null>;
    constructor_pair?: Record<string, number | string | null>;
    circuit_profile?: Record<string, number | string | null>;
    [key: string]: Record<string, number | string | null> | undefined;
  };
  top_contributions?: Array<{
    feature: string;
    contribution: number;
    abs_contribution: number;
    direction: "up" | "down" | string;
  }>;
  bias?: number;
};

export type ApiHealth = {
  status: string;
};

export type Circuit = {
  circuitId: number;
  circuitRef: string;
  name: string;
  location: string;
  country: string;
};

export type Race = {
  raceId: number;
  year: number;
  round: number;
  circuitId: number;
  name: string;
  date: string;
  time: string | null;
  status: "future" | "past";
  circuitImageUrl?: string | null;
  circuitImageSource?: "openf1" | null;
  circuit?: Circuit;
};

export type DriverOption = {
  driverId: number;
  number: string | null;
  constructorId: number;
  name: string;
  teamName: string;
  teamColor: string | null;
  headshotUrl: string | null;
  label: string;
};

export type ConstructorOption = {
  constructorId: number;
  name: string;
  label: string;
};

export type RaceApiDriver = {
  driverNumber: number;
  name: string;
  teamName: string;
};

export type LocalF1Data = {
  races: Race[];
  circuits: Circuit[];
  drivers: DriverOption[];
  constructors: ConstructorOption[];
  latestParticipants: ParticipantRequest[];
  participantsByRace: Record<string, ParticipantRequest[]>;
  raceApiDrivers: Record<string, RaceApiDriver[]>;
};

export type SavedPrediction = {
  id: string;
  created_at: string;
  source: "predicts" | "races";
  simulation_count: number;
  race: Pick<Race, "raceId" | "circuitId" | "name" | "date">;
  request: PredictionRequest;
  averaged_predictions: PredictionItem[];
  raw_predictions?: PredictionResponse[];
};
