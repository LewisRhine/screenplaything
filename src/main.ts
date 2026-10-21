import { attachSmoothCaret } from "./caret"
import { getCurrentDiv } from "./getCurrentDiv"
import { onKeyDown } from "./mutation"
import { attachPagination } from "./pagination"
import { doc, formateMenuItems, sceneDesignationsMenuItems } from "./state/siteState"
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
    modeEle.innerText = `Mode: ${doc.mode}`

    const currentDiv = getCurrentDiv()!

    if (doc.mode === "Action") {
        currentDiv.className = "action"
    }
    if (doc.mode === "Scene Heading") {
        currentDiv.className = "scene-heading"
    }
    if (doc.mode === "Character") {
        currentDiv.className = "character"
        if (doc.characters.length > 0) doc.menuMode = "charPicker"
    }
    if (doc.mode === "Dialogue") {
        currentDiv.className = "dialogue"
    }
})

doc.sub(() => {
    if (doc.menuMode === "closed") return menu.remove()
    else docEle.append(menu)

    if (doc.menuMode === "charPicker") {
        // const characters = doc.charactersFilter.length > 0 ? doc.charactersFilter : doc.characters
        // console.log(characters);

        menu.innerHTML = ""
        doc.charactersFilter.forEach((item, index) => {
            menu.innerHTML += `<li data-value="${item}" ${index === 0 ? `class="highlighted"` : " "}>${item}</li>`
        })

        return
    }

    if (doc.menuMode === "sceneDesignation") doc.menuItems = [...sceneDesignationsMenuItems]
    if (doc.menuMode === "formate") doc.menuItems = [...formateMenuItems]

    menu.innerHTML = ""
    doc.menuItems.forEach((item, index) => {
        menu.innerHTML += `<li data-value="${item}" ${index === 0 ? `class="highlighted"` : " "}>${item}</li>`
    })
    doc.menuIndex = 0
})

doc.sub(() => {
    menu.children[doc.menuIndex - 1]?.classList.remove("highlighted")
    menu.children[doc.menuIndex]?.classList.add("highlighted")
    menu.children[doc.menuIndex + 1]?.classList.remove("highlighted")
})

docEle.addEventListener("keypress", () => {
    doc.body = docEle.innerHTML
})

docEle.addEventListener("keydown", (ev) => {
    const { key } = ev

    // if (ctrlKey && key === "s") {
    //     ev.preventDefault()
    //     if (doc.menuMode === "sceneDesignation") doc.menuMode = "closed"
    //     else doc.menuMode = "sceneDesignation"
    // }

    // if (ctrlKey && key === "a") {
    //     ev.preventDefault()
    //     setAction()
    // }

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
    // if (doc.menuMode === "formate") return formateMenuKeys(ev)

    onKeyDown(ev, getCurrentDiv()!)
})
