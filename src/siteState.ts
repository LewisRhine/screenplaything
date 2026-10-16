import { suggest } from "./charSuggest"
import { newState, persist } from "./state"

type Mode = "Action" | "Character" | "Dialogue"

interface Line {
  mode: Mode
  body: string
}

export const doc = newState({
  mode: "Action" as Mode,
  body: "",
  lines: [] as Line[],
  characters: [] as string[],
  suggestMenuIndex: 0,
  suggestMenuOpen: false,
})

// persist({ doc })
