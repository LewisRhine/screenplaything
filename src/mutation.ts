import { getCurrentDiv } from "./main"
import { doc } from "./siteState"

export function onEnter() {
  const currentDiv = getCurrentDiv()!
  if (currentDiv.id === "doc" || doc.suggestMenuOpen) return

  setTimeout(() => {
    const nextDiv = currentDiv.nextElementSibling!

    if (currentDiv?.className === "character") {
      nextDiv.className = "dialogue"
      doc.mode = "Dialogue"
      doc.characters.push(currentDiv.innerText)
    }
    if (currentDiv?.className === "dialogue") {
      nextDiv.className = "action"
      doc.mode = "Action"
    }
  }, 0)
}

export function onTab() {
  const currentDiv = getCurrentDiv()!
  if (currentDiv.textContent !== "") return

  if (doc.mode === "Action") {
    currentDiv.className = "character"
    doc.mode = "Character"
    doc.suggestMenuOpen = doc.characters.length > 0
  }
}

function suggestMenu(ev: KeyboardEvent) {
  const { key } = ev
  if (key === "ArrowUp" && doc.suggestMenuIndex > 0) {
    ev.preventDefault()
    doc.suggestMenuIndex--
  }
  if (key === "ArrowDown" && doc.suggestMenuIndex < 5 - 1) {
    ev.preventDefault()
    doc.suggestMenuIndex++
  }

  if (key === "Enter") {
    setTimeout(() => {
      const currentDiv = getCurrentDiv()!
      const previousDiv = currentDiv.previousElementSibling!
      previousDiv.textContent = doc.characters[doc.suggestMenuIndex] ?? ""
      currentDiv.className = "dialogue"
      doc.suggestMenuOpen = false
    })
  }
}

export function onAnykeydown(ev: KeyboardEvent) {
  if (doc.suggestMenuOpen) return suggestMenu(ev)

  const currentDiv = getCurrentDiv()!
  if (currentDiv.className === "character") {
    setTimeout(() => {
      const filter = doc.characters.filter((value) =>
        value.toUpperCase().includes(currentDiv.innerText),
      )
      // hintEle.innerText = filter.toString()
    }, 0)
  }
}
