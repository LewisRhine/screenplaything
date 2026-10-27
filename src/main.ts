import { attachSmoothCaret } from "./caret"
import { getCurrentDiv } from "./getCurrentDiv"
import { isCaretAtEnd } from "./isCaretAtEnd"
import { attachPagination } from "./pagination"
import { doc, sceneDesignationsMenuItems } from "./state/siteState"
import "./style.css"

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<section id="center">
  <div id="connection"></div>
  <div id="mode" class="hero">Mode: </div>
  <div class="paper-stack">
    <div id="pages" class="paper-pages" aria-hidden="true"></div>
    <div id="doc" class="doc" tabindex="-1" contenteditable="true"></div>
  </div>
  <div id="hint"></div>
  <ul id="custom-datalist" hidden="true"></ul>
</section>
`

const modeEle = document.getElementById("mode")!
export const docEle = document.getElementById("doc")!

const menu = document.createElement("ul")
menu.id = "menu"
menu.className = "suggest-menu"

attachPagination(docEle, document.getElementById("pages")!)
attachSmoothCaret(docEle)

if (doc.body === "") {
  const startDiv = document.createElement("div")
  startDiv.className = "action"
  startDiv.innerHTML = "<br>"
  docEle.append(startDiv)
  docEle.focus()
} else {
  docEle.innerHTML = doc.body
}

// -------- Mode el
doc.sub(() => {
  if (doc.mode !== "Character") return (doc.characterBuffer = "")
  doc.characterBuffer = getCurrentDiv()?.textContent ?? ""
})

doc.sub(() => {
  modeEle.innerText = `Mode: ${doc.mode}`

  const currentDiv = getCurrentDiv()!

  if (doc.mode === "Action") currentDiv.className = "action"

  if (doc.mode === "Scene Heading") {
    currentDiv.className = "scene-heading"

    if (!currentDiv.textContent) doc.menuMode = "sceneDesignation"

    const match = currentDiv.textContent.match(/^(?:(.*?)\.\s*)?(.+?)(?:\s*-\s*(.+))?$/)

    const prefix = match?.[1]?.trim() ?? ""
    const location = match?.[2]?.trim() ?? ""
    const time = match?.[3]?.trim() ?? ""

    if (prefix && !location && isCaretAtEnd(docEle)) doc.menuMode = "sceneLocation"
  }

  if (doc.mode === "Dialogue") currentDiv.className = "dialogue"

  if (doc.mode === "Character") {
    currentDiv.className = "character"

    if (doc.characters.length > 0 && doc.characterBuffer.length === 0) doc.menuMode = "charPicker"
  }
})
// --------

// -------- Menu

doc.sub(() => {
  if (doc.menuMode === "closed") return menu.remove()
  else getCurrentDiv()?.append(menu)

  if (doc.menuMode === "sceneDesignation") {
    const char = doc.characterBuffer
    doc.menuIndex = 0
    doc.menuItems =
      !char || doc.menuItemsFilter.length === 0 ? (sceneDesignationsMenuItems as string[]) : doc.menuItemsFilter
  }

  if (doc.menuMode === "sceneLocation") {
    const char = doc.characterBuffer
    doc.menuIndex = 0
    doc.menuItems = !char && doc.menuItemsFilter.length === 0 ? [...doc.locations] : doc.menuItemsFilter

    // doc.menuItems = [...sceneDesignationsMenuItems]
  }

  if (doc.menuMode === "charPicker") {
    // const char = getCurrentDiv()?.textContent.toUpperCase()
    const char = doc.characterBuffer

    console.log({ char }, !char, doc.menuItemsFilter)

    doc.menuIndex = 0
    doc.menuItems = !char && doc.menuItemsFilter.length === 0 ? doc.characters : doc.menuItemsFilter
  }
  //   if (doc.menuMode === "sceneDesignation") doc.menuItems = [...sceneDesignationsMenuItems]
  //   if (doc.menuMode === "format") doc.menuItems = [...formatMenuItems]
  //
  //   menu.innerHTML = ""
  //   doc.menuItems.forEach((item, index) => {
  //     menu.innerHTML += `<li data-value="${item}" ${index === 0 ? `class="highlighted"` : " "}>${item}</li>`
  //   })
  //   doc.menuIndex = 0
})

doc.sub(() => {
  menu.innerHTML = ""
  doc.menuItems.forEach((item, index) => {
    menu.innerHTML += `<li data-value="${item}" ${index === 0 ? `class="highlighted"` : " "}>${item}</li>`
  })
})

doc.sub(() => {
  menu.children[doc.menuIndex - 1]?.classList.remove("highlighted")
  menu.children[doc.menuIndex]?.classList.add("highlighted")
  menu.children[doc.menuIndex + 1]?.classList.remove("highlighted")
})

doc.sub(() => {
  if (doc.menuItemsFilter.length === 0) doc.menuMode = "closed"
  // if (doc.menuItemsFilter.length === 0) doc.menuMode = "closed"
})

// --------

docEle.addEventListener("keyup", () => {
  doc.body = docEle.innerHTML
})

docEle.addEventListener("keydown", (ev) => {
  const { ctrlKey, shiftKey, key } = ev

  if (ctrlKey && key === "m") {
    ev.preventDefault()
    if (doc.menuMode !== "closed") return (doc.menuMode = "closed")

    if (doc.mode === "Scene Heading") doc.menuMode = "sceneDesignation"
    if (doc.mode === "Character") doc.menuMode = "charPicker"
  }

  if (key === "Tab") {
    ev.preventDefault()
    if (doc.menuMode !== "closed" || getCurrentDiv()?.textContent) return
    if (doc.mode === "Character") return (doc.mode = "Action")
    if (doc.mode === "Scene Heading") return (doc.mode = "Action")
    if (doc.mode === "Action") {
      if (shiftKey) doc.mode = "Scene Heading"
      else doc.mode = "Character"
      return
    }
  }

  if (doc.mode === "Dialogue") {
    if (key === "Enter") doc.mode = "Action"
  }

  if (doc.mode === "Character") {
    if (!ctrlKey && key.length === 1) {
      doc.characterBuffer += key.toUpperCase()
      const char = doc.characterBuffer
      doc.menuItemsFilter = doc.characters.filter((value) => value.slice(0, char.length) === char)
    }

    if (key === "Backspace") {
      doc.characterBuffer = doc.characterBuffer.slice(0, doc.characterBuffer.length - 1)
      const char = doc.characterBuffer
      doc.menuItemsFilter = doc.characters.filter((value) => value.slice(0, char.length) === char)
    }

    if (key === "Enter") {
      const name = doc.characterBuffer
      if (name && !doc.characters.includes(name)) doc.characters.push(name)
      doc.characterBuffer = ""
      doc.mode = "Dialogue"
    }
  }

  if (doc.mode === "Scene Heading") {
    if (!ctrlKey && key.length === 1) {
      doc.characterBuffer += key.toLocaleUpperCase()
      const char = doc.characterBuffer
      doc.menuItemsFilter = doc.menuItems.filter((value) => value.slice(0, char.length) === char)
    }

    if (key === "Backspace") {
      doc.characterBuffer = doc.characterBuffer.slice(0, doc.characterBuffer.length - 1)
      const char = doc.characterBuffer
      doc.menuItemsFilter = doc.menuItems.filter((value) => value.slice(0, char.length) === char)
    }

    if (key === "Enter" && doc.menuMode === "closed") {
      const match = doc.characterBuffer.match(/^(?:(.*?)\.\s*)?(.+?)(?:\s*-\s*(.+))?$/)

      // const prefix = match?.[1]?.trim() ?? ""
      const location = match?.[2]?.trim() ?? ""
      // const time = match?.[3]?.trim() ?? ""

      if (location && !doc.locations.includes(location)) doc.locations.push(location)
      doc.characterBuffer = ""
      doc.mode = "Action"
    }
  }

  if (doc.menuMode !== "closed") {
    if (key === "Escape") doc.menuMode = "closed"

    if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowRight") ev.preventDefault()
    if (key === "ArrowUp" && doc.menuIndex > 0) doc.menuIndex--
    if (key === "ArrowDown" && doc.menuIndex < doc.menuItems.length - 1) doc.menuIndex++
    if (key === "ArrowLeft" && !doc.characterBuffer) doc.menuMode = "closed"

    if (key === "Enter") {
      if (doc.menuMode === "sceneDesignation") {
        ev.preventDefault()
        document.execCommand("insertText", false, `${doc.menuItems[doc.menuIndex]}\u00A0`)
        // doc.menuMode = doc.locations.length > 0 ? "sceneLocation" : "closed"
        doc.menuMode = "closed"

        return
      }

      if (doc.menuMode === "sceneLocation") {
        ev.preventDefault()
        setTimeout(() => {
          document.execCommand("insertText", false, `${doc.menuItems[doc.menuIndex]}\u00A0`)
          doc.characterBuffer = `${doc.menuItems[doc.menuIndex]} `
          doc.menuMode = "closed"
          doc.menuItems = []
        }, 0)

        return
      }

      if (doc.menuMode === "charPicker") {
        // BUG if there is text in the char line it just add to it
        document.execCommand("insertText", false, doc.menuItems[doc.menuIndex] ?? "")
        doc.mode = "Dialogue"
        doc.menuMode = "closed"

        return
      }
    }
    return
  }

  if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowRight" || key === "ArrowLeft" || key === "Backspace") {
    setTimeout(() => {
      doc.menuMode = "closed"
      const currentClass = getCurrentDiv()?.className ?? ""
      // todo celarn filter and chr menu if not char
      if (currentClass === "scene-heading") doc.mode = "Scene Heading"
      if (currentClass === "action") doc.mode = "Action"
      if (currentClass === "dialogue") doc.mode = "Dialogue"
      if (currentClass === "character") doc.mode = "Character"
    }, 0)
  }

  // if (doc.menuMode === "charPicker") return charPickerMenuKeys(ev, getCurrentDiv()!)
  // if (doc.menuMode === "format") return formatMenuKeys(ev)

  // onKeyDown(ev, getCurrentDiv()!)
})
