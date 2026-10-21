import { newState, persist } from "../state"

export type Mode = "Action" | "Character" | "Dialogue" | "Scene Heading"

type MenuModes = "closed" | "charPicker" | "formate" | "sceneDesignation"

type SceneDesignation = "INT." | "EXT." | "INT./EXT."

export const sceneDesignationsMenuItems: readonly SceneDesignation[] = ["INT.", "EXT.", "INT./EXT."]
export const formateMenuItems: readonly Mode[] = ["Scene Heading", "Action", "Character", "Dialogue"]

export const doc = newState({
    mode: "Character" as Mode,
    body: "",
    menuMode: "closed" as MenuModes,
    menuIndex: 0,
    menuItems: [] as string[],

    characters: ["BOB", "MIKE"] as string[],
    charactersFilter: [] as string[],
})

// persist({ doc })
