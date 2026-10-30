import { attachSmoothCaret } from "./caret"
import { getCurrentDiv } from "./getCurrentDiv"
import { isCaretAtEnd } from "./isCaretAtEnd"
import { attachPagination } from "./pagination"
import { doc, sceneDesignationsMenuItems, sceneTimeMenuItems } from "./state/siteState"
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

doc.sub(() => {
  if (doc.mode === "Scene Heading") {
    const match = doc.characterBuffer.match(/^(?:(.*?)\.\s*)?(.+?)(?:\s*-\s*(.+))?$/)
    doc.sceneDesBuffer = match?.[1]?.trim() ?? ""
    doc.sceneLocationBuffer = match?.[2]?.trim() ?? ""
    doc.sceneTimeBuffer = match?.[3]?.trim() ?? ""
  }
})

// -------- Mode el
doc.sub(() => {
  // this is so the mode get is pickedup kind of an issue with the state sytem.
  if (!doc.mode) return

  doc.characterBuffer = getCurrentDiv()?.textContent ?? ""
  // if (doc.mode !== "Character") return (doc.characterBuffer = "")
})

doc.sub(() => {
  modeEle.innerText = `Mode: ${doc.mode}`

  const currentDiv = getCurrentDiv()
  if (!currentDiv) return

  if (doc.mode === "Action") currentDiv.className = "action"

  if (doc.mode === "Scene Heading") {
    currentDiv.className = "scene-heading"
    const { sceneDesBuffer, sceneLocationBuffer, sceneTimeBuffer } = doc

    // const timeMode = doc.characterBuffer.las/
    
    if (!sceneDesBuffer && !sceneLocationBuffer && !sceneTimeBuffer) doc.menuMode = "sceneDesignation"
    if (sceneDesBuffer && !sceneLocationBuffer && isCaretAtEnd(currentDiv)) doc.menuMode = "sceneLocation"
    if (sceneDesBuffer && sceneLocationBuffer && !sceneTimeBuffer && isCaretAtEnd(docEle)) doc.menuMode = "sceneTime"
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
    const char = doc.sceneLocationBuffer
    doc.menuIndex = 0
    doc.menuItems = !char && doc.menuItemsFilter.length === 0 ? [...doc.locations] : doc.menuItemsFilter
  }

  if (doc.menuMode === "sceneTime") {
    const char = doc.sceneTimeBuffer
    doc.menuIndex = 0
    doc.menuItems = !char || doc.menuItemsFilter.length === 0 ? (sceneTimeMenuItems as string[]) : doc.menuItemsFilter
  }

  if (doc.menuMode === "charPicker") {
    const char = doc.characterBuffer
    doc.menuIndex = 0
    doc.menuItems = !char && doc.menuItemsFilter.length === 0 ? doc.characters : doc.menuItemsFilter
  }
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
})

// --------

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

  if (doc.menuMode !== "closed") {
    if (key === "Escape") doc.menuMode = "closed"

    if (key === "ArrowUp" || key === "ArrowDown") ev.preventDefault()
    if (key === "ArrowUp" && doc.menuIndex > 0) doc.menuIndex--
    if (key === "ArrowDown" && doc.menuIndex < doc.menuItems.length - 1) doc.menuIndex++
    if (key === "ArrowLeft" && !doc.characterBuffer) doc.menuMode = "closed"

    if (key !== "Enter") return

    if (doc.menuMode === "sceneDesignation") {
      ev.preventDefault()
      const item = `${doc.menuItems[doc.menuIndex]} `
      document.execCommand("insertText", false, item)
      doc.characterBuffer = item
      doc.menuMode = "closed"
      doc.menuItems = []

      return
    }

    if (doc.menuMode === "sceneLocation") {
      ev.preventDefault()
      const item = `${doc.menuItems[doc.menuIndex]} `
      document.execCommand("insertText", false, item)
      doc.characterBuffer = item
      doc.menuMode = "closed"
      doc.menuItems = []

      return
    }

    if (doc.menuMode === "sceneTime") {
      ev.preventDefault()
      const item = ` ${doc.menuItems[doc.menuIndex]}`
      document.execCommand("insertText", false, item)
      doc.characterBuffer = item
      doc.menuMode = "closed"
      doc.menuItems = []

      return
    }

    if (doc.menuMode === "charPicker") {
      getCurrentDiv()!.textContent = ""
      doc.characterBuffer = ""
      document.execCommand("insertText", false, doc.menuItems[doc.menuIndex] ?? "")
      return
    }
  }
})

docEle.addEventListener("input", (ev) => {
  doc.body = docEle.innerHTML

  const { data, inputType } = ev

  if (data) {
    doc.characterBuffer += data.toUpperCase()
    const char = doc.characterBuffer
    doc.menuItemsFilter = doc.characters.filter((value) => value.slice(0, char.length) === char)
  }

  if (inputType === "deleteContentBackward") {
    doc.characterBuffer = doc.characterBuffer.slice(0, doc.characterBuffer.length - 1)
    const char = doc.characterBuffer
    doc.menuItemsFilter = doc.characters.filter((value) => value.slice(0, char.length) === char)
  }

  if (doc.mode === "Character") {
    if (inputType === "insertParagraph") {
      if (doc.menuMode === "charPicker") {
        doc.menuMode = "closed"
        doc.mode = "Dialogue"
        return
      }

      const name = doc.characterBuffer
      if (name && !doc.characters.includes(name)) doc.characters.push(name)
      doc.characterBuffer = ""
      doc.mode = "Dialogue"
    }

    return
  }

  if (doc.mode === "Dialogue") {
    if (inputType === "insertParagraph") doc.mode = "Action"
    return
  }

  if (doc.mode === "Scene Heading") {
    // if (data) {
    //   doc.characterBuffer += data.toLocaleUpperCase()
    //   const char = doc.characterBuffer
    //   doc.menuItemsFilter = doc.menuItems.filter((value) => value.slice(0, char.length) === char)
    // }

    // if (inputType === "deleteContentBackward") {
    //   doc.characterBuffer = doc.characterBuffer.slice(0, doc.characterBuffer.length - 1)
    //   const char = doc.characterBuffer
    //   doc.menuItemsFilter = doc.menuItems.filter((value) => value.slice(0, char.length) === char)
    // }

    if (inputType === "insertParagraph") {
      const match = doc.characterBuffer.match(/^(?:(.*?)\.\s*)?(.+?)(?:\s*-\s*(.+))?$/)

      // const prefix = match?.[1]?.trim() ?? ""
      const location = match?.[2]?.trim() ?? ""
      // const time = match?.[3]?.trim() ?? ""

      if (location && !doc.locations.includes(location)) doc.locations.push(location)
      doc.characterBuffer = ""
      doc.mode = "Action"
    }

    return
  }
})

docEle.addEventListener("keyup", (ev) => {
  const { key } = ev
  if (doc.menuMode !== "closed") return

  if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowRight" || key === "ArrowLeft" || key === "Backspace") {
    const currentClass = getCurrentDiv()?.className ?? ""
    // todo celarn filter and chr menu if not char
    if (currentClass === "scene-heading") doc.mode = "Scene Heading"
    if (currentClass === "action") doc.mode = "Action"
    if (currentClass === "dialogue") doc.mode = "Dialogue"
    if (currentClass === "character") doc.mode = "Character"
  }
})
