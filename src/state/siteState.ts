import { newState } from "../state"

export type Mode = "Action" | "Character" | "Dialogue" | "Scene Heading"

type MenuModes = "closed" | "charPicker" | "format" | "sceneDesignation" | "sceneLocation" | "sceneTime"

type SceneDesignation = "INT." | "EXT." | "INT./EXT."

export const sceneDesignationsMenuItems: readonly SceneDesignation[] = ["INT.", "EXT.", "INT./EXT."]
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

  characterBuffer: "",
  characters: [] as string[],
})

// persist({ doc })

export const sceneDesignationMenu = newState({
  open: false,
  menuIndex: 0,
  menuItems: ["Scene Heading", "Action", "Character", "Dialogue"] as readonly Mode[],
})
