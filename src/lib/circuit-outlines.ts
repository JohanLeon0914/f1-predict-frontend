export type CircuitOutline = {
  path: string;
  viewBox: string;
};

export const fallbackCircuitOutline: CircuitOutline = {
  viewBox: "0 0 180 86",
  path: "M18 57 C29 25, 67 15, 91 31 C107 42, 111 63, 139 54 C166 46, 179 67, 153 78 C125 90, 98 68, 72 72 C45 77, 8 83, 18 57Z",
};

const circuitOutlinesByRef: Record<string, CircuitOutline> = {
  americas: {
    viewBox: "0 0 180 86",
    path: "M19 27 L44 16 L70 19 L92 14 L118 23 L136 38 L158 36 L169 50 L159 65 L134 72 L108 65 L83 74 L58 68 L41 54 L24 59 L12 46 Z",
  },
  baku: {
    viewBox: "0 0 180 86",
    path: "M15 58 L43 58 L43 21 L66 21 L66 42 L88 42 L88 28 L112 28 L112 49 L151 49 L164 62 L151 72 L109 72 L109 61 L77 61 L77 72 L43 72 L31 66 L15 66 Z",
  },
  interlagos: {
    viewBox: "0 0 180 86",
    path: "M33 52 C28 35, 43 19, 64 18 C88 17, 91 35, 78 45 C67 53, 76 67, 99 67 C123 67, 146 55, 155 36 C162 22, 175 32, 168 50 C158 74, 126 82, 93 79 C55 75, 38 69, 33 52Z",
  },
  losail: {
    viewBox: "0 0 180 86",
    path: "M35 61 C19 44, 26 22, 50 18 L91 16 C124 15, 156 29, 162 50 C167 67, 150 78, 125 73 L95 67 L66 73 C52 76, 43 70, 35 61Z",
  },
  madring: {
    viewBox: "0 0 180 86",
    path: "M19 58 L19 35 L42 24 L74 24 L74 42 L101 42 L101 18 L139 18 L159 34 L159 58 L137 70 L103 70 L103 55 L75 55 L75 72 L42 72 Z",
  },
  marina_bay: {
    viewBox: "0 0 180 86",
    path: "M22 59 L22 39 L48 39 L48 22 L77 22 L77 38 L101 38 L101 20 L132 20 L132 36 L158 36 L166 51 L151 64 L119 64 L119 49 L93 49 L93 69 L55 69 L55 55 Z",
  },
  monza: {
    viewBox: "0 0 180 86",
    path: "M20 58 C18 38, 34 22, 59 20 L121 16 C150 14, 168 29, 165 51 C162 71, 139 78, 115 70 L82 58 L50 70 C35 76, 22 71, 20 58Z",
  },
  rodriguez: {
    viewBox: "0 0 180 86",
    path: "M18 54 L18 35 L51 30 L78 36 L100 23 L137 23 L158 39 L158 57 L141 70 L110 70 L110 54 L85 54 L65 67 L35 67 Z",
  },
  vegas: {
    viewBox: "0 0 180 86",
    path: "M20 60 L20 47 L61 47 L61 30 L151 30 L164 42 L164 59 L150 71 L78 71 L78 58 L47 58 L47 68 L26 68 Z",
  },
  yas_marina: {
    viewBox: "0 0 180 86",
    path: "M21 59 L21 39 L49 28 L84 31 L103 18 L145 18 L162 34 L162 52 L143 66 L113 66 L96 53 L66 66 L37 66 Z",
  },
};

export function getCircuitOutline(circuitRef?: string | null): CircuitOutline {
  if (!circuitRef) return fallbackCircuitOutline;
  return circuitOutlinesByRef[circuitRef] ?? fallbackCircuitOutline;
}
