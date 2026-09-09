Quiero implementar dentro de la sección UFC/MMA de GRDX1 un nuevo minijuego de carrera inspirado conceptualmente en los juegos web de decisiones rápidas como "El Ídolo" de Potrero.

IMPORTANTE:
No copies su diseño, código, textos, eventos ni identidad visual.
Quiero tomar únicamente el concepto general de:
- carrera rápida;
- decisiones;
- consecuencias;
- eventos aleatorios;
- estadísticas;
- múltiples caminos;
- resultado final compartible.

Debe tener identidad propia de GRDX1 y estar ambientado en la carrera de un peleador profesional de MMA.

==================================================
CONCEPTO
==================================================

Nombre provisional:

GRDX1: ROAD TO GLORY

El usuario comienza siendo un peleador amateur desconocido y debe intentar construir una carrera legendaria.

La partida debe poder completarse aproximadamente en 5-10 minutos.

Cada partida debe ser diferente.

El usuario tendrá que tomar decisiones como:

- disciplina principal;
- gimnasio;
- entrenadores;
- aceptar/rechazar peleas;
- contratos;
- cambios de organización;
- subir/bajar de categoría;
- campamentos;
- preparación;
- recuperación;
- rivalidades;
- lesiones;
- oportunidades de short notice;
- title eliminators;
- peleas por campeonato;
- decisiones económicas;
- retiro.

NO debe ser un simulador de apuestas.

==================================================
CREACIÓN DEL PELEADOR
==================================================

Al comenzar:

CREATE YOUR FIGHTER

Name
Nationality
Age
Weight class
Fighting style

Estilos iniciales:

STRIKER
WRESTLER
BJJ SPECIALIST
KICKBOXER
BALANCED

Cada estilo modifica las estadísticas iniciales.

Ejemplo:

Striker:
striking +15
power +10
grappling -10

Wrestler:
wrestling +15
cardio +5
striking -5

BJJ:
grappling +15
submission +15
takedownDefense -5

El usuario comienza aproximadamente entre 18 y 22 años.

==================================================
ESTADO DEL JUGADOR
==================================================

Crear un objeto central FighterCareerState.

Ejemplo conceptual:

{
  age,
  season,
  record: {
    wins,
    losses,
    draws,
    koWins,
    submissionWins
  },

  stats: {
    striking,
    power,
    wrestling,
    grappling,
    cardio,
    chin,
    defense,
    speed
  },

  health: 100,
  confidence: 50,
  popularity: 0,
  reputation: 0,
  money: 500,
  ranking: null,

  weightClass,
  fightingStyle,

  organization: "Regional",

  contract: null,

  titles: [],
  defenses: 0,

  injuries: [],

  relationships: {
    coach: 50,
    fans: 20,
    promotion: 20
  },

  flags: {}
}

TODAS las decisiones y eventos deben modificar este estado.

==================================================
LOOP PRINCIPAL
==================================================

La carrera debe sentirse como una historia.

Ejemplo:

AGE 19
AMATEUR

↓

"Three gyms want to train you."

[Local MMA Gym]
Cheap
+balanced development

[Elite Wrestling Academy]
Expensive
+wrestling

[Kickboxing Camp]
+striking
-wrestling development

↓

AGE 20

FIRST PROFESSIONAL FIGHT

↓

AGE 21

3-0 PROFESSIONAL RECORD

↓

"Regional promotion offers you a contract."

ACCEPT
DECLINE

↓

etc.

==================================================
SISTEMA DE EVENTOS CONFIGURABLE
==================================================

ESTO ES MUY IMPORTANTE.

NO quiero que los eventos estén hardcodeados dentro de componentes React.

Crear un sistema data-driven.

Debe existir una carpeta similar a:

/game-data
    events/
        career-events.ts
        injuries.ts
        contracts.ts
        training.ts
        relationships.ts
        media.ts
        fights.ts
        championships.ts
        retirement.ts

o JSON si resulta más conveniente.

Agregar nuevos eventos debe requerir únicamente agregar un objeto.

Ejemplo:

{
  id: "short_notice_fight",

  type: "opportunity",

  sentiment: "neutral",

  title: "SHORT NOTICE CALL",

  description:
    "A fighter pulled out five days before the event. The promotion calls you.",

  conditions: {
    minWins: 3,
    maxLosses: 2,
    minHealth: 70,
    minReputation: 20,
    organizations: ["Regional", "Major"]
  },

  probability: 0.12,

  cooldown: 5,

  choices: [
    {
      id: "accept",

      label: "Take the fight",

      effects: {
        reputation: +15,
        health: -10,
        confidence: +5
      },

      flags: {
        shortNoticeFight: true
      }
    },

    {
      id: "decline",

      label: "Decline",

      effects: {
        health: +5,
        promotionRelationship: -5
      }
    }
  ]
}

==================================================
GOOD / BAD / NEUTRAL EVENTS
==================================================

Cada evento debe poder clasificarse:

positive
negative
neutral
opportunity
career_defining

Pero el sistema NO debe asumir que positive siempre significa que todo es bueno.

Ejemplo:

"You've gone viral after a spectacular KO."

popularity +30
reputation +15
confidence +10

pero también puede:

pressure +10

Otro:

"Training Injury"

negative

health -30

Pero podría desbloquear:

comebackStory = true

que posteriormente permita eventos positivos.

==================================================
CONDICIONES
==================================================

Crear un sistema flexible de condiciones.

Los eventos pueden depender de:

age
wins
losses
record
ranking
organization
money
health
popularity
reputation
fightingStyle
weightClass
champion
titles
defenses
previousEvents
flags
injuries
winStreak
lossStreak
careerStage

Debe soportar:

min
max
equals
notEquals
includes
excludes
AND
OR

Ejemplo:

conditions: {
  all: [
    { field: "record.wins", operator: ">=", value: 8 },
    { field: "ranking", operator: "<=", value: 5 },
    { field: "flags.isChampion", operator: "==", value: false }
  ]
}

==================================================
EVENT CHAINS
==================================================

Permitir eventos conectados.

Ejemplo:

EVENT 1

You insult another fighter during an interview.

↓

flag:
rivalryStarted = true

↓

varias temporadas después:

EVENT 2

Your rival calls you out.

↓

ACCEPT FIGHT
IGNORE HIM

↓

si ocurre la pelea:

EVENT 3

RIVALRY FIGHT

↓

si ganas:

EVENT 4

"You just finished your biggest rival."

popularity +40

Estas cadenas deben poder definirse desde configuración.

==================================================
EVENTOS ALEATORIOS
==================================================

Incluir muchos eventos como:

Training injury
Broken hand
Knee injury
Bad weight cut
Great training camp
Coach disagreement
New coach
Gym change
Sponsorship
Viral knockout
Controversial decision
Short-notice fight
Opponent withdrawal
Replacement opponent
Contract offer
Contract dispute
New promotion
Media controversy
Fan favorite
Losing streak
Winning streak
Rival calls you out
Move weight class
Title eliminator
Title shot
Championship fight
Successful defense
Superfight
Comeback
Retirement offer

La probabilidad debe ser configurable.

No todos deben aparecer en todas las carreras.

==================================================
PELEAS
==================================================

Cuando se produzca una pelea, generar un rival.

El rival debe tener:

name
age
record
style
stats
ranking

La probabilidad de ganar NO debe ser simplemente 50/50.

Calcularla usando:

fighter stats
opponent stats
style matchup
health
camp quality
confidence
age
momentum
random variance

Ejemplo:

winProbability =
skill +
styleMatchup +
health +
camp +
randomness

NO mostrar necesariamente el porcentaje exacto al usuario antes de la pelea.

==================================================
DECISIONES ANTES DE PELEAR
==================================================

Ejemplo:

FIGHT CAMP

You have 8 weeks.

What do you focus on?

[STRIKING]

+striking
+power

[WRESTLING]

+wrestling
+takedown defense

[CARDIO]

+cardio
+health

[GAME PLAN]

bonus against opponent style

Después:

WEIGHT CUT

[Safe cut]

menos riesgo
menor ventaja física

[Aggressive cut]

mayor ventaja
riesgo de health penalty

==================================================
RESOLUCIÓN DE PELEAS
==================================================

La pelea debe generar resultados como:

WIN
KO/TKO
SUBMISSION
DECISION

LOSS
KO/TKO
SUBMISSION
DECISION

También:

split decision
majority decision
draw

El resultado debe depender de los estilos.

Un striker poderoso debería tener mayor probabilidad de KO.

Un BJJ specialist mayor probabilidad de submission.

==================================================
EVENTOS DURANTE LA PELEA
==================================================

Para peleas importantes mostrar decisiones rápidas.

Ejemplo:

ROUND 3

Your opponent is slowing down.

[PUSH FOR THE FINISH]

High risk
High reward

[STAY TECHNICAL]

Lower risk

[TAKE HIM DOWN]

Depends on wrestling/grappling

Estas decisiones pueden modificar la resolución.

==================================================
PROGRESIÓN
==================================================

Crear etapas:

AMATEUR
REGIONAL PROSPECT
PROFESSIONAL
RISING PROSPECT
RANKED CONTENDER
TOP 10
TOP 5
TITLE CONTENDER
CHAMPION
LEGEND

No todos deben llegar a Champion.

Una mala carrera también debe ser interesante.

==================================================
CAMPEONATO
==================================================

Cuando el jugador llega a cierto ranking:

TITLE ELIMINATOR

↓

TITLE SHOT

↓

CHAMPIONSHIP FIGHT

↓

si gana:

WORLD CHAMPION

Después:

TITLE DEFENSE #1
TITLE DEFENSE #2
...

También permitir:

lose championship
win it again
move division
become double champion

==================================================
EDAD Y DECLIVE
==================================================

La edad debe importar.

Por ejemplo:

18-27
development

28-32
prime

33-36
possible decline

37+
strong decline

Pero con variación aleatoria.

Un peleador puede mantenerse competitivo más tiempo.

==================================================
LESIONES
==================================================

Las lesiones deben tener:

severity
duration
affectedStats
recoveryProbability
permanentPenalty

Ejemplo:

ACL injury

health -40
speed -10

Recovery:

6-12 months

Puede dejar:

speed -3 permanent

==================================================
DECISIONES ECONÓMICAS
==================================================

El dinero debe tener utilidad.

Ejemplo:

Training camp:

LOCAL CAMP
$500

ELITE CAMP
$5,000

WORLD CLASS CAMP
$20,000

Mejores camps ofrecen mejores bonuses.

También:

nutritionist
physiotherapist
specialized coach
recovery
management

==================================================
FINAL DE LA CARRERA
==================================================

El jugador puede:

retire voluntarily

o eventualmente verse obligado por:

age
health
injuries

Al finalizar generar:

CAREER LEGACY CARD

Debe ser extremadamente compartible.

Mostrar:

NAME

RECORD
28-4-1

KO
12

SUB
7

TITLES
2

DEFENSES
6

CAREER EARNINGS
$4.2M

PEAK RANKING
#1

LEGACY SCORE
9,240

y un rango:

FORGOTTEN PROSPECT
JOURNEYMAN
CONTENDER
FAN FAVORITE
CHAMPION
DOMINANT CHAMPION
MMA LEGEND
GOAT

==================================================
LEGACY SCORE
==================================================

Crear un sistema de puntuación.

Considerar:

wins
quality of opponents
finishes
championships
title defenses
win streaks
double champion
longevity
popularity

No permitir farmear score peleando contra rivales débiles.

==================================================
VIRALIDAD
==================================================

Esto es extremadamente importante.

Diseñar una pantalla final que pueda convertirse fácilmente en una imagen vertical 9:16 para:

TikTok
Instagram Stories
X
WhatsApp

Ejemplo:

GRDX1
ROAD TO GLORY

JOHAN LEON

MMA LEGEND

31 - 3 - 0

2x WORLD CHAMPION
8 TITLE DEFENSES
18 FINISHES

LEGACY
9,420

TOP 1.8%

CAN YOU BEAT MY CAREER?

GRDX1.COM

Agregar:

Share Career
Copy Result
Play Again

==================================================
DAILY CAREER
==================================================

Crear arquitectura para:

DAILY CAREER

Todos los usuarios reciben la misma:

seed
starting fighter
event probabilities
initial opportunities

durante ese día.

Pero las decisiones producen resultados diferentes.

Esto permitiría:

"Today's GRDX1 Challenge"

y rankings diarios.

==================================================
SEEDED RANDOMNESS
==================================================

Implementar RNG basado en seed.

Una carrera debe poder reproducirse usando:

careerSeed

No usar Math.random directamente en la lógica central.

Esto permitirá:

daily challenges
shareable careers
debugging
replays
server validation

==================================================
EVENT HISTORY
==================================================

Guardar cronológicamente toda la carrera.

Ejemplo:

2027
Professional debut
WIN - KO R2

2028
Signed regional contract

2029
5 fight win streak

2030
Major promotion debut

2031
Ranked #12

2032
Title eliminator

2033
WORLD CHAMPION

2035
3 title defenses

2037
Lost championship

2039
Regained championship

2041
Retired

Mostrarlo visualmente como una timeline.

==================================================
EVENT EDITOR FRIENDLY ARCHITECTURE
==================================================

La arquitectura debe permitir que posteriormente yo pueda crear 100, 300 o 1000 eventos SIN modificar el engine.

Quiero poder crear simplemente:

events/media.ts
events/injuries.ts
events/contracts.ts

y agregar objetos.

Crear:

EventDefinition
EventCondition
EventChoice
EventEffect
EventChain
EventTrigger

El engine debe:

1. obtener estado actual;
2. buscar eventos elegibles;
3. eliminar eventos que no cumplen conditions;
4. respetar cooldowns;
5. aplicar probability/weight;
6. seleccionar evento usando seeded RNG;
7. presentar choices;
8. aplicar effects;
9. establecer flags;
10. registrar resultado;
11. continuar carrera.

==================================================
DEV EVENT DEBUGGER
==================================================

Crear una herramienta disponible únicamente en desarrollo:

/ufc/career/dev

Debe permitir:

ver todos los eventos
buscar eventos
filtrar positive/negative
ver conditions
forzar evento
modificar FighterCareerState
avanzar edad
añadir wins/losses
cambiar ranking
activar flags

Esto será fundamental para poder probar cientos de eventos.

==================================================
VALIDACIÓN
==================================================

Al iniciar la aplicación validar todos los archivos de eventos.

Detectar:

duplicate IDs
invalid conditions
missing choices
invalid effects
references to nonexistent events
broken chains

Mostrar errores claros en development.

==================================================
DISEÑO
==================================================

Mantener completamente la identidad actual de GRDX1.

Dark UI.
Negro / charcoal.
Tipografía blanca.
Rojo para momentos importantes.
Dorado únicamente para achievements/legacy.

NO hacerlo parecer un casino.
NO usar estética de apuestas.
NO usar monedas flotando.
NO usar tragamonedas.
NO usar odds.

Debe sentirse como:

sports documentary
+
career simulator
+
interactive story

Las decisiones deben presentarse como cards grandes.

Ejemplo:

YOUR CONTRACT EXPIRES

Three promotions contact your manager.

┌─────────────┐
│ SAFE MOVE   │
│ $40K/FIGHT  │
│ Regional    │
└─────────────┘

┌─────────────┐
│ BIG LEAGUE  │
│ $25K/FIGHT  │
│ Hard fights │
└─────────────┘

┌─────────────┐
│ BET ON YOU  │
│ Stay free   │
│ High risk   │
└─────────────┘

Las consecuencias NO siempre deben mostrarse antes de elegir.

==================================================
ARQUITECTURA
==================================================

Separar completamente:

Game Engine
Game Data
UI
Persistence
RNG
Scoring
Fight Simulation

Algo similar:

/ufc-career
  /engine
      career-engine.ts
      event-engine.ts
      fight-engine.ts
      condition-engine.ts
      effect-engine.ts
      rng.ts
      scoring.ts

  /data
      /events
      /opponents
      /organizations
      /styles
      /injuries

  /types

  /components

  /utils

No mezclar reglas de negocio con componentes React.

==================================================
PRIMERA VERSIÓN
==================================================

Para el MVP implementar mínimo:

50 eventos configurables
10 lesiones
10 eventos positivos
10 negativos
10 oportunidades
10 career-defining

5 fighting styles

career progression

fight simulation

championship system

retirement

legacy score

shareable result card

seeded RNG

event history

dev debugger

Diseña primero la arquitectura y los tipos.

Después implementa el engine.

Después los eventos.

Después la UI.

No destruyas ni reestructures las páginas existentes de GRDX1.
Este juego debe añadirse como una nueva experiencia dentro de UFC.