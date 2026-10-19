import { newState, persist } from "../state";

type Mode = "Action" | "Character" | "Dialogue" | "Scene Heading";

interface Line {
  mode: Mode;
  body: string;
}

export const doc = newState({
  mode: "Action" as Mode,
  body: "",
  lines: [] as Line[],

  characterBuffer: "",
  characters: [] as string[],
  charactersFilter: [] as string[],
  charPickerMenuIndex: 0,
  charPickerMenuOpen: false,

  formateMenuOpen: false,
  formateMenuIndex: 0,
  formateMenuItems: ["Scene Heading", "Action", "Character", "Dialogue"] as Mode[]
});

// persist({ doc })
