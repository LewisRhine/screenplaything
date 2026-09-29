import { newState } from "./state"
import "./style.css"

type Mode = "Actoin" | "Character" | "Dialogue"

const doc = newState({
  mode: "Actoin" as Mode,
  body: "",
  characters: [] as string[],
})

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<section id="center">
  <div id="mode" class="hero">Mode: </div>
  <div id="doc" class="doc" tabindex="-1" contenteditable="plaintext-only"></div>
</section>
`

const modeEle = document.getElementById("mode")!
const docEle = document.getElementById("doc")!

doc.sub(() => {
  modeEle.innerText = `Mode: ${doc.mode}`
})

docEle.addEventListener("input", () => {
  doc.body = docEle.innerText
})

docEle.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") {
    const lines = doc.body.split(/\r?\n/)
    const lastLine = lines[lines.length - 1]
    if (doc.mode === "Character") {
      doc.mode = "Dialogue"
      doc.characters.push(lastLine)
    }
  }

  if (ev.key === "Tab") {
    docEle.focus()
    ev.preventDefault()
    if (doc.mode === "Actoin") doc.mode = "Character"
  }
})

doc.sub(() => {
  // docEle.innerText = doc.body
})
