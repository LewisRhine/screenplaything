import { doc, type Mode } from "./state/siteState"

export function onEnter(currentElement: HTMLDivElement) {
    if (doc.mode === "Character") {
        const name = currentElement.textContent.toUpperCase()
        if (!doc.characters.includes(name)) doc.characters.push(name)
        doc.mode = "Dialogue"

        return
    }

    if (doc.mode === "Dialogue") return (doc.mode = "Action")
}

export function onTab(currentElement: HTMLDivElement) {
    if (currentElement.textContent !== "" && doc.mode !== "Action") return

    doc.mode = "Character"
    // if (doc.characters.length > 0) doc.menuMode = "charPicker"
}

export function onKeyDown(ev: KeyboardEvent, currentElement: HTMLDivElement) {
    const { altKey, key } = ev

    if (altKey) {
        ev.preventDefault()
        if (doc.menuMode === "formate") doc.menuMode = "closed"
        else doc.menuMode = "formate"
    }

    // this is broken need to re think
    if (doc.mode === "Character") {
        setTimeout(() => {
            const char = currentElement.textContent?.toUpperCase()

            // if (char === "") {
            //     doc.charactersFilter = []
            //     doc.menuMode = "charPicker"
            //     return
            // }

            doc.charactersFilter = doc.characters.filter((value) => value.slice(0, char.length) === char)

            if (doc.charactersFilter.length > 0) doc.menuMode = "charPicker"
        }, 0)
    }

    if (doc.menuMode !== "closed") {
        if (key === "ArrowUp" || key === "ArrowDown") ev.preventDefault()
        if (key === "ArrowUp" && doc.menuIndex > 0) doc.menuIndex--
        if (key === "ArrowDown" && doc.menuIndex < doc.menuItems.length - 1) doc.menuIndex++

        if (key === "Enter") {
            if (doc.menuMode === "charPicker") {
                setTimeout(() => {
                    currentElement.textContent = doc.menuItems[doc.menuIndex] ?? ""
                }, 0)

                // this feels bad! make find better way
                setTimeout(() => {
                    doc.mode = "Dialogue"
                }, 1)
            }

            if (doc.menuMode === "formate") {
                ev.preventDefault()
                const formate: Mode = doc.menuItems[doc.menuIndex] as Mode
                doc.mode = formate
            }

            doc.menuMode = "closed"
        }

        return
    }

    if (key === "Enter") onEnter(currentElement)

    if (ev.key === "Tab") {
        ev.preventDefault()
        onTab(currentElement)
        return
    }
}
