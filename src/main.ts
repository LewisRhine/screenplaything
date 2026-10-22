import { attachSmoothCaret } from "./caret"
import { getCurrentDiv } from "./getCurrentDiv"
import { onKeyDown } from "./mutation"
import { attachPagination } from "./pagination"
import { doc, formatMenuItems, sceneDesignationsMenuItems } from "./state/siteState"
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
  modeEle.innerText = `Mode: ${doc.mode}`

  doc.menuMode = "closed"

  const currentDiv = getCurrentDiv()!

  if (doc.mode === "Action") currentDiv.className = "action"

  if (doc.mode === "Scene Heading") {
    currentDiv.className = "scene-heading"
    // if (!currentDiv.textContent) doc.menuMode = "sceneDesignation"
  }

  if (doc.mode === "Dialogue") currentDiv.className = "dialogue"

  if (doc.mode === "Character") {
    currentDiv.className = "character"
    // if (doc.characters.length > 0) doc.menuMode = "charPicker"
  }
})
// --------

// -------- Menu

doc.sub(() => {
  if (doc.menuMode === "closed") return menu.remove()
  else getCurrentDiv()?.append(menu)

  if (doc.menuMode === "sceneDesignation") {
    doc.menuItems = [...sceneDesignationsMenuItems]
  }

  if (doc.menuMode === "charPicker") {
    const char = getCurrentDiv()?.textContent?.toUpperCase()
    doc.menuItems = !char && doc.charactersFilter.length === 0 ? doc.characters : doc.charactersFilter
  }

  // todo is this bad that it renders?
  menu.innerHTML = ""
  doc.menuItems.forEach((item, index) => {
    menu.innerHTML += `<li data-value="${item}" ${index === doc.menuIndex ? `class="highlighted"` : " "}>${item}</li>`
  })

  //   if (doc.menuMode === "sceneDesignation") doc.menuItems = [...sceneDesignationsMenuItems]
  //   if (doc.menuMode === "format") doc.menuItems = [...formatMenuItems]
  //
  //   menu.innerHTML = ""
  //   doc.menuItems.forEach((item, index) => {
  //     menu.innerHTML += `<li data-value="${item}" ${index === 0 ? `class="highlighted"` : " "}>${item}</li>`
  //   })
  //   doc.menuIndex = 0
})

// --------

// doc.sub(() => {
//   console.log("mmenu", menu.children[doc.menuIndex - 1])
//   console.log("mmenu", menu.children[doc.menuIndex])
//   console.log("mmenu", menu.children[doc.menuIndex + 1])
//
//   menu.children[doc.menuIndex - 1]?.classList.remove("highlighted")
//   menu.children[doc.menuIndex]?.classList.add("highlighted")
//   menu.children[doc.menuIndex + 1]?.classList.remove("highlighted")
// })

docEle.addEventListener("keyup", () => {
  doc.body = docEle.innerHTML
})

docEle.addEventListener("keydown", (ev) => {
  const { ctrlKey, key } = ev

  if (ctrlKey && key === " ") {
    ev.preventDefault()
    if (doc.menuMode !== "closed") return (doc.menuMode = "closed")

    if (doc.mode === "Scene Heading") doc.menuMode = "sceneDesignation"
    if (doc.mode === "Character") doc.menuMode = "charPicker"
  }

  if (doc.menuMode !== "closed") {
    if (key === "ArrowUp" || key === "ArrowDown") ev.preventDefault()
    if (key === "ArrowUp" && doc.menuIndex > 0) doc.menuIndex--
    if (key === "ArrowDown" && doc.menuIndex < doc.menuItems.length - 1) doc.menuIndex++

    if (key === "Enter") {
      if (doc.menuMode === "sceneDesignation") {
        ev.preventDefault()
        const currentElement = getCurrentDiv()!
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
    }

    return
  }

  if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowRight" || key === "ArrowLeft") {
    setTimeout(() => {
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
