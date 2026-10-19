/*
 * BUZLIME: NIGHT SHIFT — a branching zombie story.
 *
 * Every scene has text (which can depend on the state) and choices. A choice can be hidden
 * (`when`), shown but locked with a reason (`need` + `why`), change the state (`run`), and
 * pick its destination at random by returning a scene id from `run`.
 * Dropping to 0 health anywhere ends the run in the "bad" ending.
 */

export type EndingId = "best" | "alt" | "funny" | "lone" | "bad";

export interface State {
  hp: number;
  items: string[];
  flags: string[];
  /** Minutes since midnight — shown as the clock. */
  minutes: number;
}

export interface Choice {
  label: string;
  to: string;
  when?: (s: State) => boolean;
  need?: (s: State) => boolean;
  why?: string;
  /** Mutates a copy of the state; may return a scene id to go somewhere else (random outcomes). */
  run?: (s: State) => string | void;
  /** A short result line — used for actions that keep you in the same scene. */
  say?: string;
}

export interface Scene {
  text: (s: State) => string;
  choices?: Choice[];
  ending?: EndingId;
  /** How long the scene takes, in minutes (default 4). */
  mins?: number;
}

export const MAX_HP = 3;
export const START: State = { hp: MAX_HP, items: [], flags: [], minutes: 2 * 60 + 47 };

export const ENDINGS: Record<EndingId, { title: string; emoji: string; kind: string }> = {
  best: { title: "Fleet Commander", emoji: "🏆", kind: "Best ending" },
  alt: { title: "Stay Chill", emoji: "🧊", kind: "Alternative ending" },
  funny: { title: "Zombie Happy Hour", emoji: "🍋", kind: "Lucky ending" },
  lone: { title: "Employee of the Month", emoji: "🚐", kind: "Lone ending" },
  bad: { title: "Zombie On Call", emoji: "🧟", kind: "Bad ending" },
};
export const ENDING_ORDER: EndingId[] = ["best", "alt", "funny", "lone", "bad"];

export const ITEMS: Record<string, string> = {
  flashlight: "🔦 Flashlight",
  extinguisher: "🧯 Extinguisher",
  keycard: "💳 Master keycard",
  fuse: "🔌 Generator fuse",
};
export const COMPANIONS: Record<string, string> = { murat: "Murat", deniz: "Deniz", cat: "Byte 🐈" };

export const has = (s: State, item: string) => s.items.includes(item);
export const is = (s: State, flag: string) => s.flags.includes(flag);
const give = (s: State, item: string) => void (has(s, item) || s.items.push(item));
const take = (s: State, item: string) => void (s.items = s.items.filter((i) => i !== item));
const set = (s: State, flag: string) => void (is(s, flag) || s.flags.push(flag));
const hurt = (s: State, n = 1) => void (s.hp -= n);

const INTERN = "At 08:00 the morning shift finds you";
const DEDICATION = "“Wow,” says the intern. “Dedication.”";

export const SCENES: Record<string, Scene> = {
  intro: {
    mins: 0,
    text: () => `02:47 — Buzlime warehouse, on the edge of town.

You're the on-call engineer tonight, babysitting a firmware update for 40 drink kiosks across the city. The progress bar says 63%. It has said 63% for an hour.

Outside, a car alarm starts. Then stops. Mid-beep.

Murat, the night guard, radioed in twenty minutes ago. He hasn't since.

Your phone buzzes: “EMERGENCY ALERT — Stay indoors. Do NOT approach anyone who is acting—” The message cuts off. The lights flicker once, twice… and the warehouse drops into red emergency lighting.`,
    choices: [
      { label: "Check the security cameras", to: "cams" },
      { label: "Radio Murat", to: "radio" },
      { label: "Put your headphones on. The update needs you.", to: "headphones" },
    ],
  },

  headphones: {
    text: () => `64%! Progress. You lean back, satisfied.

Your noise-cancelling headphones are excellent. That's why you don't hear the office window break behind you.

A cold hand lands on your shoulder.`,
    choices: [
      { label: "Throw your coffee at it", to: "coffee", run: (s) => (hurt(s), set(s, "coffee")) },
      { label: "Stay perfectly still. Maybe it's a dream.", to: "end_still" },
    ],
  },

  coffee: {
    text: () => `Hot americano, straight in the face. It screeches and staggers back, clawing at its eyes. In the red light you catch a glimpse of a Buzlime delivery uniform. Name tag: “KEREM — Here to help!”

Not tonight, Kerem.

Something scratches your arm as you squeeze past. Not a bite. Probably.`,
    choices: [{ label: "Run into the hallway", to: "hall" }],
  },

  radio: {
    text: () => `Static. Then Murat, whispering:

“Don't come out. They're… they're not people anymore. They go for light and noise. I'm hiding in the guard booth at the gate. If the power dies for good, the doors unlock and—”

A thud. Static. Then, very faintly: “…the generator… needs a fuse…”`,
    choices: [
      { label: "“Hold on, Murat. I'm coming.”", to: "hall", run: (s) => set(s, "promised") },
      { label: "Check the cameras first", to: "cams" },
    ],
  },

  cams: {
    text: () => `The monitor wall flickers to life.

FRONT GATE — Murat's flashlight lies in the road, still on. Three figures sway around the guard booth, moving like a video that keeps buffering.

LOADING DOCK — The delivery van's back door is open. Someone is on the van's roof, waving a pallet jack handle at the camera. Deniz, the courier from the late restock.

WORKSHOP — Something small and orange sits on top of a kiosk, staring straight into the lens. Byte, the warehouse cat. Unbothered.

COLD ROOM — Empty. −2 °C. The compressor is running on battery: 19%.`,
    choices: [{ label: "Head out into the hallway", to: "hall" }],
  },

  hall: {
    mins: 2,
    text: (s) => {
      const out = [
        `The main hallway, washed in red emergency light. Somewhere above you, the ventilation groans.

Doors lead to the workshop, the cold room, the loading dock and the server room. At the far end, the glass entrance looks out on the front gate.`,
      ];
      if (!is(s, "wall")) out.push("On the wall: an emergency flashlight and a fire extinguisher, both very much within reach.");
      if (is(s, "murat") && is(s, "deniz")) out.push("Murat and Deniz are right behind you, arguing in whispers about whether zombies can swim.");
      else if (is(s, "murat")) out.push("Murat follows you, jumping at every shadow.");
      else if (is(s, "deniz")) out.push("Deniz follows you, pallet jack handle at the ready.");
      if (is(s, "cat")) out.push("Byte rides on your shoulder, purring like a small engine.");
      return out.join("\n\n");
    },
    choices: [
      {
        label: "Take the flashlight and the fire extinguisher",
        to: "hall",
        when: (s) => !is(s, "wall"),
        run: (s) => (give(s, "flashlight"), give(s, "extinguisher"), set(s, "wall")),
        say: "You take both. You feel about 40% braver.",
      },
      { label: "Go to the front gate", to: "gate", when: (s) => !is(s, "murat") && !is(s, "muratLost") },
      { label: "Go to the loading dock", to: "dock" },
      { label: "Go to the workshop", to: "workshop" },
      { label: "Go to the cold room", to: "coldroom" },
      { label: "Go to the server room", to: "server" },
    ],
  },

  gate: {
    text: () => `Cold night air. The front gate stands wide open and the guard booth's window is cracked. Inside, you can see Murat's boots. They're shaking.

Between you and the booth: three of them. Swaying. Faces turned up to the blinking orange gate light, as if they're listening to a song only they can hear.`,
    choices: [
      {
        label: "Throw the flashlight into the parking lot as a decoy",
        to: "gate_decoy",
        need: (s) => has(s, "flashlight"),
        why: "You'd need a light to throw",
        run: (s) => (take(s, "flashlight"), give(s, "keycard"), set(s, "murat")),
      },
      {
        label: "Charge in with the fire extinguisher",
        to: "gate_charge",
        need: (s) => has(s, "extinguisher"),
        why: "You'd need something to fight with",
        run: (s) => (hurt(s), take(s, "extinguisher"), give(s, "keycard"), set(s, "murat")),
      },
      { label: "Yell to draw them away from the booth", to: "gate_shout", run: (s) => (hurt(s), set(s, "muratLost")) },
      { label: "Back inside. This is a terrible idea.", to: "hall" },
    ],
  },

  gate_decoy: {
    text: (s) => `The flashlight spins through the air and lands in the parking lot, beam pointing at the sky. All three heads turn. Slowly, like moths, they shuffle toward the light.

Murat bursts out of the booth and grabs you in a bear hug. “${is(s, "promised") ? "You said you'd come and you actually came!" : "You came! Nobody ever comes!"}”

He presses a plastic card into your hand. “Master keycard. Server room. You'll need it.”`,
    choices: [{ label: "Back inside — together", to: "hall" }],
  },

  gate_charge: {
    text: () => `You pull the pin and charge, screaming. A white cloud swallows the gate. Coughing, chaos, flailing arms — and somewhere in the fog, a hand finds yours. It's Murat's. Probably.

Something catches your ankle on the way out. You kick free and leave a shoe behind. Worth it.

At the door, Murat presses a plastic card into your hand. “Master keycard. Server room. Don't lose it. Or your other shoe.”`,
    choices: [{ label: "Back inside — together", to: "hall" }],
  },

  gate_shout: {
    text: () => `“HEY! OVER HERE!”

All three heads snap toward you at once. Murat's plan was quiet. Yours was not.

You sprint back and slam the glass door just as they hit it — but one of them gets a hand on your sleeve first, and you feel nails through the fabric. Through the glass, you watch Murat slip out of the booth and run off into the night.

With the keycard.`,
    choices: [{ label: "Back to the hallway", to: "hall" }],
  },

  dock: {
    text: (s) =>
      is(s, "deniz")
        ? `The loading dock is quiet now, apart from a few lemonade bottles rolling gently across the concrete.

The van's spare keys still hang on the hook by the door.`
        : `The loading dock smells like diesel and lime syrup. The delivery van's back door hangs open, and on its roof stands Deniz, holding a pallet jack handle like a sword.

Around the van: four of them. Circling.

“HEY! ENGINEER!” Deniz shouts. “A little help?!”

Next to you: a stack of lemonade crates fresh from the cold room, a forklift with the key still in it, and the van's spare keys on a hook by the door.`,
    choices: [
      { label: "Roll ice-cold lemonade bottles across the floor", to: "dock_bottles", when: (s) => !is(s, "deniz"), run: (s) => (set(s, "deniz"), set(s, "knowsCold")) },
      { label: "Jump on the forklift and drive straight at them", to: "dock_forklift", when: (s) => !is(s, "deniz"), run: (s) => (hurt(s), set(s, "deniz")) },
      { label: "Grab the van keys. You're out of here.", to: "end_lone" },
      { label: "Back away slowly", to: "hall", when: (s) => !is(s, "deniz"), say: "“TRAITOR!” Deniz yells after you. Fair." },
      { label: "Back to the hallway", to: "hall", when: (s) => is(s, "deniz") },
    ],
  },

  dock_bottles: {
    text: () => `Clink. Clink. Clink. Ice-cold bottles skitter across the concrete, frost steaming off the glass.

The zombies stop and watch the bottles roll. They pick them up, very slowly, as if they remember something about being thirsty — and the moment their fingers touch the cold glass, they slow down even more. One of them just stands there, holding a bottle, shivering.

Interesting. They really don't like the cold.

Deniz slides down the windshield and runs over. “You saved me with LEMONADE?” A beat. “…Respect.”`,
    choices: [{ label: "Back to the hallway with Deniz", to: "hall" }],
  },

  dock_forklift: {
    text: () => `You have never driven a forklift. This becomes obvious immediately.

You hit a shelf, a pallet of paper cups, two zombies and — briefly — the van. Cups rain down like confetti. In the chaos, Deniz jumps from the roof onto the forklift's cage, and something claws your arm on the way out.

“Ten out of ten,” Deniz pants. “Never drive again.”`,
    choices: [{ label: "Back to the hallway with Deniz", to: "hall" }],
  },

  workshop: {
    text: (s) => {
      const out = [
        is(s, "speakers")
          ? `The workshop is a mess of smashed screens and sparking speakers. Whatever came in has moved on — for now.`
          : `The kiosk workshop. Rows of half-assembled kiosks glow in the dark, their touchscreens looping a demo: “Welcome! Hoş geldiniz! Benvenuti!”

Something heavy bangs on the roll-up door from outside. The door bends a little. Then a little more.`,
      ];
      if (!is(s, "cat")) out.push("Byte, the warehouse cat, sits on top of a kiosk, judging you.");
      if (!has(s, "fuse") && !is(s, "power")) out.push("In the spare-parts box on the workbench, something useful catches your eye: a big 63-amp fuse. The kind generators eat.");
      return out.join("\n\n");
    },
    choices: [
      { label: "Take the 63-amp fuse", to: "workshop", when: (s) => !has(s, "fuse") && !is(s, "power"), run: (s) => give(s, "fuse"), say: "You pocket the fuse. 63, like the progress bar. A sign." },
      { label: "Pick up Byte", to: "workshop", when: (s) => !is(s, "cat"), run: (s) => set(s, "cat"), say: "Byte allows it. Barely. A rumbling purr starts up against your shoulder." },
      {
        label: "Crank every demo kiosk to full volume and open the door",
        to: "workshop_swarm",
        when: (s) => !is(s, "speakers"),
        // The lucky ending: sometimes they just want a drink.
        run: (s) => {
          if (Math.random() < 0.4) return "end_happyhour";
          hurt(s);
          set(s, "speakers");
        },
      },
      { label: "Back to the hallway", to: "hall" },
    ],
  },

  workshop_swarm: {
    text: () => `The jingle blasts at full volume: “WELCOME! HOŞ GELDİNİZ! BENVENUTI!”

The roll-up door crashes open. The zombies do not dance. They do not queue. They do, however, come in.

You dive behind a kiosk while they tear into the speakers, and something rakes across your back as you escape through the side door. Behind you, the demo voice gurgles one last “Benven—” and dies.`,
    choices: [{ label: "Run back to the hallway", to: "hall" }],
  },

  coldroom: {
    text: (s) => {
      const out = [
        `The cold room: −2 °C. Shelves of ice bags and lime crates, frost on every surface, and a heavy insulated door that locks from the outside. Your breath turns to fog.

The compressor display blinks: BATTERY 19%. Without the generator, this place will be warm by sunrise.`,
      ];
      if (is(s, "knowsCold")) out.push("You think of the zombies at the dock, freezing up the moment they touched the cold glass. An idea starts to form.");
      if (is(s, "cat")) out.push("Byte digs every claw into your hoodie. Byte is not going in there.");
      return out.join("\n\n");
    },
    choices: [
      { label: "Hide in here until morning", to: "end_frozen" },
      { label: "Back to the hallway", to: "hall" },
    ],
  },

  server: {
    text: (s) => {
      const out = [`The server room door. A keycard reader glows red. You try the handle: locked. You try asking nicely: still locked.`];
      if (!has(s, "keycard")) out.push(is(s, "muratLost") ? "The master keycard ran off into the night with Murat." : "Murat has the master keycard.");
      if (!has(s, "keycard") && is(s, "cat"))
        out.push("Byte hops off your shoulder onto a shelf and paws at a loose ceiling vent, then looks back at you, as if this should have been obvious.");
      return out.join("\n\n");
    },
    choices: [
      { label: "Swipe the master keycard", to: "server_in", need: (s) => has(s, "keycard"), why: "You don't have the keycard" },
      { label: "Crawl through the vent after Byte", to: "server_in", when: (s) => !has(s, "keycard") && is(s, "cat") },
      { label: "Kick the door", to: "server", when: (s) => !has(s, "keycard"), say: "The door wins. Your foot files a complaint." },
      { label: "Back to the hallway", to: "hall" },
    ],
  },

  server_in: {
    text: () => `The server room. Silent racks, dead fans, and in the corner the backup generator, cold and patient. Its fuse slot is empty.

Your laptop still shows the update: 63%. To finish, it needs the uplink. The uplink needs power.`,
    choices: [
      { label: "Install the fuse and start the generator", to: "siege", need: (s) => has(s, "fuse"), why: "The generator's fuse slot is empty", run: (s) => (take(s, "fuse"), set(s, "power")) },
      { label: "Back to the hallway", to: "hall" },
    ],
  },

  siege: {
    mins: 10,
    text: (s) => {
      const team = is(s, "murat") && is(s, "deniz");
      const out = [
        `You slam the fuse home and pull the cord. The generator coughs, sputters… and ROARS.

Lights everywhere. Fans spinning. Kiosk demos start up all over the building, and the cold room compressor kicks in with a deep hum.

And outside, every zombie in the district turns toward the noise.

Within minutes there are faces at every window and hands on every door. The glass entrance starts to crack.

Your laptop chimes: UPLINK AVAILABLE — fleet update ready to resume at 63%. But the antenna on the roof has been knocked out of alignment, and somebody has to hold the door while the update runs.`,
      ];
      if (team) out.push(`Murat grabs a fire extinguisher. Deniz is already halfway up the ladder to the roof. “Do your nerd thing,” Deniz says. “We've got you.”`);
      else if (is(s, "murat") || is(s, "deniz")) out.push("You're one person short. Somebody holds the door, somebody fixes the antenna — and you can't be in two places at once.");
      else out.push(`You're alone. Completely alone.${is(s, "cat") ? " Byte doesn't count, no matter what Byte thinks." : ""}`);
      return out.join("\n\n");
    },
    choices: [
      {
        label: "Resume the update — push it to the whole fleet",
        to: "end_best",
        need: (s) => is(s, "murat") && is(s, "deniz"),
        why: "You can't hold the door and fix the antenna alone",
      },
      { label: "Lure them all into the cold room and lock the door", to: "end_cold", run: (s) => (s.hp < 2 ? "end_cold_fail" : undefined) },
      { label: "Barricade the server room and wait for sunrise", to: "end_barricade" },
    ],
  },

  // ---- Endings ---------------------------------------------------------------------------

  end_best: {
    ending: "best",
    mins: 214,
    text: () => `Murat holds the door with a fire extinguisher and a surprising number of opinions. Deniz climbs onto the roof in the rain and twists the antenna until your laptop shows five bars.

You type:  deploy --fleet all --mode beacon

64%… 80%… 97%… 100%.

Across the city, forty Buzlime kiosks wake up at once. Their screens turn bright white, and their speakers switch to a calm voice in three languages: “Shelter here. The doors lock behind you. Drinks are free tonight.”

Survivors follow the lights. The zombies follow the noise — away from the people and toward the empty stadium, where twelve kiosks are playing the demo jingle on loop.

At 06:41 the sun comes up. At 07:15 the army arrives and finds the whole city sheltered in kiosk corners, sipping lemonade.

At 08:00 your phone rings. It's the CEO. “I hear you deployed to production at 3 a.m. without a change request.” A long pause. “…You're promoted.”`,
  },

  end_cold: {
    ending: "alt",
    mins: 240,
    text: (s) => `You grab a kiosk off the wall, crank its demo to full volume and run, the jingle blaring: “WELCOME! HOŞ GELDİNİZ! BENVENUTI!”

Every zombie in the building follows you — down the hallway, past the shelves, straight into the cold room. You dive out at the last second${is(s, "murat") || is(s, "deniz") ? " and your friends slam the heavy door behind you" : " and kick the heavy door shut"}. Click.

Silence. Frost creeps slowly over the little window.

At 07:00 you dare to look inside. The zombies are… shivering. Blinking. Looking around, confused. One of them waves. ${
      is(s, "coffee") ? "It's Kerem from deliveries. “Why is it so cold in here?” he asks. “And why do I taste americano?”" : "It's the delivery guy from Tuesday. “Why is it so cold in here?” he asks."
    }

Turns out the infection can't survive two hours at −2 °C.

By noon, scientists are calling it “the Buzlime Protocol”. By evening, the marketing team has already printed the T-shirts: STAY CHILL.`,
  },

  end_happyhour: {
    ending: "funny",
    mins: 200,
    text: () => `The jingle blasts at full volume: “WELCOME! HOŞ GELDİNİZ! BENVENUTI!”

The roll-up door crashes open… and the zombies stop.

They sway. They blink at the bright screens. Then, slowly, they form a line. A perfect, orderly, very polite queue.

The first one taps the screen, chooses “Lemonade — large, extra ice” and pays with exact change from a very old wallet.

By sunrise: 1,284 drinks sold, zero bites, and the best night of revenue in Buzlime's history. The analytics dashboard calls it “an unexplained spike in nocturnal demand”.

Turns out they were never hungry. Just thirsty.`,
  },

  end_lone: {
    ending: "lone",
    mins: 180,
    text: (s) => `${
      is(s, "deniz")
        ? "You lift the keys off the hook as quietly as you can and slip out to the van. Behind you, someone calls your name. You don't look back."
        : "You grab the keys, jump into the van and floor it. In the side mirror, Deniz leaps off the roof and makes a gesture that isn't in any of the kiosk's three supported languages."
    }

You drive until the sun comes up. You survive.

The next morning, every Buzlime kiosk in the city shows the same photo: you, mid-escape, under a big headline.

EMPLOYEE OF THE MONTH: ABANDONED THE NIGHT SHIFT.`,
  },

  end_bitten: {
    ending: "bad",
    text: () => `It doesn't hurt as much as you expected. Things just get slow, and warm, and then very, very quiet.

Then you're hungry.

${INTERN} at your desk, staring at the progress bar. 63%. ${DEDICATION}

Your on-call rotation ends in six days.`,
  },

  end_still: {
    ending: "bad",
    text: () => `You stay perfectly still. It sniffs your hair. It sniffs your coffee. It very politely takes off your headphones…

…and bites.

${INTERN} at your desk, one earbud still in, staring at the progress bar. 63%. ${DEDICATION}`,
  },

  end_frozen: {
    ending: "bad",
    mins: 90,
    text: (s) => `${is(s, "cat") ? "Byte leaps off your shoulder and bolts. Cats know things. " : ""}You pull the door almost shut and curl up between the lime crates. Safe! Warm thoughts. Happy place.

By 04:30 you can't feel your fingers. By 05:00 you can't feel your opinions. When the cold finally forces you out, the hallway is full — and they're very happy to see you.

${INTERN} by the coffee machine, swaying gently. ${DEDICATION}`,
  },

  end_cold_fail: {
    ending: "bad",
    text: () => `You grab a kiosk, crank its demo to full volume and run. Every zombie in the building follows you.

Unfortunately, your injured leg follows you too — slowly. You make it to the cold room door. They make it to you.

${INTERN} guarding the cold room, swaying to a jingle only you can hear. ${DEDICATION}`,
  },

  end_barricade: {
    ending: "bad",
    mins: 120,
    text: (s) => `You stack chairs, a rack and a very confused ${is(s, "cat") ? "cat" : "office plant"} against the door. You sit down. You wait.

At 05:12 the barricade starts to slide. At 05:13 it's gone.

${INTERN} in the server room, gently headbutting a rack. ${DEDICATION}`,
  },
};

/** "02:47" from minutes since midnight. */
export function clock(minutes: number) {
  const m = Math.min(minutes, 8 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
