import { newState } from "../state"

export type Mode = "Action" | "Character" | "Dialogue" | "Scene Heading"

type MenuModes = "closed" | "charPicker" | "charExt" | "format" | "sceneDesignation" | "sceneLocation" | "sceneTime"

type SceneDesignation = "INT." | "EXT." | "INT/EXT."

export const sceneDesignationsMenuItems: readonly SceneDesignation[] = ["INT.", "EXT.", "INT/EXT."]
export const sceneTimeMenuItems: readonly string[] = ["Day", "Night"]
export const formatMenuItems: readonly Mode[] = ["Scene Heading", "Action", "Character", "Dialogue"]

export const doc = newState({
  mode: "Action" as Mode,
  body: "",

  menuMode: "closed" as MenuModes,
  menuIndex: 0,
  menuItems: [] as string[],
  menuItemsFilter: [] as string[],

  locations: ["The House"] as string[],
  sceneDesBuffer: "",
  sceneLocationBuffer: "",
  sceneTimeBuffer: "",

  characterBuffer: "",
  characters: [] as string[],
  characterExts: ["V.O.", "O.S.", "O.C.", "CONT'D"] as string[],
})

// persist({ doc })

export interface CaretPosition {
  left: number
  top: number
  height: number
}

export const caretPosition = newState<CaretPosition>({
  left: 0,
  top: 0,
  height: 0,
})
