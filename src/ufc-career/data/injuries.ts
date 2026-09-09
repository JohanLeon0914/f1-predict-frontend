import type { InjuryDefinition } from "../types";

export const injuries: InjuryDefinition[] = [
  { id: "cut_eye", name: "Bad eye cut", severity: "minor", duration: 1, affectedStats: { defense: -3 }, recoveryProbability: 0.95, permanentPenalty: {} },
  { id: "sprained_ankle", name: "Sprained ankle", severity: "minor", duration: 1, affectedStats: { speed: -4 }, recoveryProbability: 0.9, permanentPenalty: {} },
  { id: "broken_hand", name: "Broken hand", severity: "moderate", duration: 2, affectedStats: { power: -7, striking: -4 }, recoveryProbability: 0.82, permanentPenalty: { power: -1 } },
  { id: "rib_injury", name: "Rib injury", severity: "moderate", duration: 2, affectedStats: { cardio: -6, chin: -3 }, recoveryProbability: 0.84, permanentPenalty: {} },
  { id: "knee_injury", name: "Knee injury", severity: "moderate", duration: 3, affectedStats: { wrestling: -5, speed: -6 }, recoveryProbability: 0.78, permanentPenalty: { speed: -1 } },
  { id: "acl_tear", name: "ACL tear", severity: "major", duration: 4, affectedStats: { wrestling: -9, speed: -10, cardio: -4 }, recoveryProbability: 0.62, permanentPenalty: { speed: -3 } },
  { id: "concussion", name: "Concussion", severity: "major", duration: 3, affectedStats: { chin: -10, defense: -5 }, recoveryProbability: 0.7, permanentPenalty: { chin: -2 } },
  { id: "shoulder_tear", name: "Shoulder tear", severity: "major", duration: 3, affectedStats: { grappling: -7, power: -5 }, recoveryProbability: 0.72, permanentPenalty: { grappling: -2 } },
  { id: "neck_stinger", name: "Neck stinger", severity: "moderate", duration: 2, affectedStats: { grappling: -5, defense: -4 }, recoveryProbability: 0.86, permanentPenalty: {} },
  { id: "bad_weight_cut", name: "Bad weight cut", severity: "minor", duration: 1, affectedStats: { cardio: -5, chin: -3 }, recoveryProbability: 0.92, permanentPenalty: {} },
];
