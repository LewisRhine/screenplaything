import { doc, type Mode } from "./state/siteState"

export function onEnter(ev: KeyboardEvent, currentElement: HTMLDivElement) {
  if (doc.menuMode === "charPicker") {
    setTimeout(() => {
      currentElement.textContent = doc.menuItems[doc.menuIndex] ?? ""
    }, 0)

    // this feels bad! make find better way
    setTimeout(() => {
      doc.mode = "Dialogue"
      doc.menuMode = "closed"
    }, 1)

    return
  }

  if (doc.menuMode === "sceneDesignation") {
    ev.preventDefault()
    setTimeout(() => {
      currentElement.textContent = `${doc.menuItems[doc.menuIndex]}\u00A0`
      const range = document.createRange()
      range.selectNodeContents(currentElement)
      range.collapse(false)

      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }

      doc.menuMode = "closed"
    }, 0)

    return
  }

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
    if (doc.menuMode === "format") doc.menuMode = "closed"
    else doc.menuMode = "format"
  }

  // this is broken need to re think
  if (doc.mode === "Character") {
    setTimeout(() => {
      const char = currentElement.textContent?.toUpperCase()

      doc.charactersFilter = doc.characters.filter((value) => value.slice(0, char.length) === char)

      if (doc.charactersFilter.length > 0) doc.menuMode = "charPicker"
    }, 0)
  }

  if (key === "Enter") onEnter(ev, currentElement)

  if (doc.menuMode !== "closed") {
    if (key === "ArrowUp" || key === "ArrowDown") ev.preventDefault()
    if (key === "ArrowUp" && doc.menuIndex > 0) doc.menuIndex--
    if (key === "ArrowDown" && doc.menuIndex < doc.menuItems.length - 1) doc.menuIndex++

    return
  }

  if (ev.key === "Tab") {
    ev.preventDefault()
    onTab(currentElement)
    return
  }
}
