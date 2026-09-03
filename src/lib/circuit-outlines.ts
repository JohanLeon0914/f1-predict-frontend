export type CircuitOutline = {
  path: string;
  viewBox: string;
};

export const fallbackCircuitOutline: CircuitOutline = {
  viewBox: "0 0 180 86",
  path: "M18 57 C29 25, 67 15, 91 31 C107 42, 111 63, 139 54 C166 46, 179 67, 153 78 C125 90, 98 68, 72 72 C45 77, 8 83, 18 57Z",
};

const circuitAssetRefs = new Set([
  "albert_park", "americas", "bahrain", "baku", "catalunya", "hungaroring",
  "interlagos", "jeddah", "losail", "marina_bay", "miami", "monaco", "monza",
  "red_bull_ring", "rodriguez", "shanghai", "silverstone", "spa", "suzuka", "vegas",
  "villeneuve", "yas_marina", "zandvoort",
]);

export function getCircuitAssetPath(circuitRef?: string | null) {
  return circuitRef && circuitAssetRefs.has(circuitRef)
    ? `/circuits/${circuitRef}.svg`
    : null;
}

const circuitOutlinesByRef: Record<string, CircuitOutline> = {
  albert_park: {
    viewBox: "0 0 180 86",
    path: "M25 57 C14 43, 25 24, 47 21 L83 20 C99 18, 111 25, 106 38 C101 51, 114 58, 133 53 L157 45 C171 41, 176 54, 165 64 C151 77, 124 76, 102 68 C76 59, 54 76, 35 70 C28 68, 25 63, 25 57Z",
  },
  americas: {
    viewBox: "0 0 180 86",
    path: "M19 27 L44 16 L70 19 L92 14 L118 23 L136 38 L158 36 L169 50 L159 65 L134 72 L108 65 L83 74 L58 68 L41 54 L24 59 L12 46 Z",
  },
  baku: {
    viewBox: "0 0 180 86",
    path: "M15 58 L43 58 L43 21 L66 21 L66 42 L88 42 L88 28 L112 28 L112 49 L151 49 L164 62 L151 72 L109 72 L109 61 L77 61 L77 72 L43 72 L31 66 L15 66 Z",
  },
  catalunya: {
    viewBox: "0 0 180 86",
    path: "M25 59 C17 47, 22 29, 40 24 L74 20 L101 23 L128 18 L155 27 L163 43 L151 57 L127 62 L107 54 L84 58 L65 70 L39 69 C31 68, 26 64, 25 59Z",
  },
  hungaroring: {
    viewBox: "0 0 180 86",
    path: "M27 57 C18 46, 27 28, 47 25 L80 25 L98 17 L127 22 L151 35 L158 52 L145 65 L116 68 L98 58 L76 67 L48 65 C38 64, 30 62, 27 57Z",
  },
  interlagos: {
    viewBox: "0 0 180 86",
    path: "M33 52 C28 35, 43 19, 64 18 C88 17, 91 35, 78 45 C67 53, 76 67, 99 67 C123 67, 146 55, 155 36 C162 22, 175 32, 168 50 C158 74, 126 82, 93 79 C55 75, 38 69, 33 52Z",
  },
  miami: {
    viewBox: "0 0 180 86",
    path: "M19 58 L19 34 L43 22 L76 22 L76 35 L111 35 L111 20 L143 20 L161 34 L161 57 L145 70 L112 70 L112 57 L82 57 L82 71 L46 71 L46 58 Z",
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
  monaco: {
    viewBox: "0 0 180 86",
    path: "M22 56 L22 39 L43 39 L43 22 L66 22 L66 46 L91 46 L91 26 L116 26 L116 39 L141 39 L159 51 L151 66 L125 66 L125 54 L101 54 L101 71 L73 71 L73 57 L49 57 L49 69 L29 69 Z",
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
  red_bull_ring: {
    viewBox: "0 0 180 86",
    path: "M24 57 C19 43, 30 27, 48 25 L81 24 L104 17 L138 21 L158 35 L155 49 L137 55 L116 49 L94 58 L74 70 L46 68 C34 67, 26 63, 24 57Z",
  },
  shanghai: {
    viewBox: "0 0 180 86",
    path: "M25 54 C18 40, 31 24, 52 24 L80 25 C91 25, 96 18, 108 18 L139 22 C158 25, 166 39, 156 51 C148 61, 129 59, 116 53 C103 47, 92 55, 84 65 C73 78, 49 73, 36 66 C29 62, 26 58, 25 54Z",
  },
  silverstone: {
    viewBox: "0 0 180 86",
    path: "M23 55 L23 37 L42 26 L68 26 L83 18 L113 21 L136 32 L157 31 L164 45 L153 59 L130 65 L107 58 L88 68 L62 68 L43 60 L29 65 Z",
  },
  spa: {
    viewBox: "0 0 180 86",
    path: "M20 59 C18 45, 30 31, 46 29 L61 19 L84 25 L99 40 L121 42 L136 26 L157 30 L165 45 L151 60 L130 69 L108 63 L89 70 L63 64 L44 72 L27 67 Z",
  },
  suzuka: {
    viewBox: "0 0 180 86",
    path: "M24 55 C22 39, 37 24, 55 25 C74 26, 78 42, 67 51 C58 59, 68 68, 84 67 C101 66, 104 52, 96 43 C88 34, 98 22, 115 24 C135 27, 149 40, 158 55 L147 69 L123 68 L110 57 L97 75 L70 74 L51 64 L31 67 Z",
  },
  villeneuve: {
    viewBox: "0 0 180 86",
    path: "M19 57 L30 39 L54 39 L64 22 L88 22 L88 39 L113 39 L113 24 L139 24 L160 37 L160 57 L143 69 L118 69 L103 57 L81 57 L67 70 L42 70 Z",
  },
  zandvoort: {
    viewBox: "0 0 180 86",
    path: "M28 59 C18 48, 26 31, 43 25 L73 20 L101 24 L126 18 L151 27 L162 43 L151 59 L126 66 L104 59 L82 70 L53 68 C41 67, 32 64, 28 59Z",
  },
};

export function getCircuitOutline(circuitRef?: string | null): CircuitOutline {
  if (!circuitRef) return fallbackCircuitOutline;
  return circuitOutlinesByRef[circuitRef] ?? fallbackCircuitOutline;
}
