<<<<<<< HEAD
import { attachSmoothCaret } from "./caret";
import { attachPagination } from "./pagination";
import { newState } from "./state";
import { attachWebrtcPanel } from "./webrtc-panel";
import "./style.css";

type Mode = "Actoin" | "Character" | "Dialogue";

interface Line {
    mode: Mode;
    body: string;
}

const doc = newState({
    mode: "Actoin" as Mode,
    body: "",
    lines: [] as Line[],
    characters: [] as string[],
});
=======
import { onAnykeydown, onEnter, onTab } from "./mutation"
import { doc } from "./siteState"
import "./style.css"
>>>>>>> b489573 (got the basics working)

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<section id="center">
  <div id="connection"></div>
  <div id="mode" class="hero">Mode: </div>
<<<<<<< HEAD
  <div class="paper-stack">
    <div id="pages" class="paper-pages" aria-hidden="true"></div>
    <div id="doc" class="doc" tabindex="-1" contenteditable="true"></div>
  </div>
  <div id="hint"></div>
</section>
`;

const modeEle = document.getElementById("mode")!;
const docEle = document.getElementById("doc")!;
const hintEle = document.getElementById("hint")!;
attachWebrtcPanel(document.getElementById("connection")!);

const startDiv = document.createElement("div");
startDiv.innerHTML = "<br>";
startDiv.className = "action";
docEle.append(startDiv);
attachPagination(docEle, document.getElementById("pages")!);
attachSmoothCaret(docEle);
docEle.focus();

doc.sub(() => {
    modeEle.textContent = `Mode: ${doc.mode}`;
});    

function getCurrentDiv(): HTMLDivElement | null {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
        return null;
    }

    const node = selection.getRangeAt(0).startContainer;

    const element =
        node.nodeType === Node.ELEMENT_NODE
            ? (node as Element)
            : node.parentElement;

    return element?.closest("div") as HTMLDivElement | null;
}

docEle.addEventListener("input", () => {
    doc.body = docEle.innerHTML;
});

docEle.addEventListener("keydown", (ev) => {
    if (ev.ctrlKey && ev.key === " ") {
        const cur = getCurrentDiv();
    }

    if (ev.key === "Enter") {
        const currentDiv = getCurrentDiv()!;
        if (currentDiv.id === "doc") return;

        setTimeout(() => {
            const nextDiv = currentDiv.nextElementSibling!;

            if (currentDiv?.className === "character") {
                nextDiv.className = "dialogue";
                doc.mode = "Dialogue";
                doc.characters.push(currentDiv.innerText);
            }
            if (currentDiv?.className === "dialogue") {
                nextDiv.className = "action";
                doc.mode = "Actoin";
            }
        }, 0);
    }

    if (ev.key === "Tab") {
        ev.preventDefault();
        const currentDiv = getCurrentDiv()!;
        if (currentDiv.textContent !== "") return;

        const aboveDiv = currentDiv.previousElementSibling;
        if (aboveDiv?.className === "action") {
            currentDiv.className = "character";
            doc.mode = "Character";
        }
    }

    const currentDiv = getCurrentDiv()!;
    if (currentDiv.className === "character") {
        setTimeout(() => {
            const filter = doc.characters.filter((value) =>
                value.toUpperCase().includes(currentDiv.innerText),
            );
            hintEle.innerText = filter.toString();
        }, 0);
    }
});
=======
  <div id="doc" class="doc" tabindex="-1" contenteditable="true"></div>
  <ul id="custom-datalist" hidden="true"></ul>
</section>
`
const modeEle = document.getElementById("mode")!
const docEle = document.getElementById("doc")!
const suggestMenu = document.getElementById("custom-datalist")!

doc.sub(() => {
  suggestMenu.hidden = !doc.suggestMenuOpen

  const index = doc.suggestMenuIndex
  const suggest = suggestMenu.children[doc.suggestMenuIndex]

  suggestMenu.children[index - 1]?.classList.remove("highlighted")
  suggestMenu.children[index + 1]?.classList.remove("highlighted")
  suggest?.classList.add("highlighted")
})

doc.sub(() => {
  // todo make more better!
  suggestMenu.innerHTML = ""
  doc.characters.forEach((char) => {
    suggestMenu.innerHTML += `<li data-value="${char}">${char}</li>`
  })
})

doc.sub(() => {
  modeEle.innerText = `Mode: ${doc.mode}`
})

if (doc.body === "") {
  const startDiv = document.createElement("div")
  startDiv.className = "action"
  startDiv.innerHTML = "<br>"
  docEle.append(startDiv)
  docEle.focus()
} else docEle.innerHTML = doc.body

suggestMenu.focus()

export function getCurrentDiv(): HTMLDivElement | null {
  const selection = window.getSelection()

  if (!selection || selection.rangeCount === 0) {
    return null
  }

  const node = selection.getRangeAt(0).startContainer

  const element =
    node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement

  return element?.closest("div") as HTMLDivElement | null
}

docEle.addEventListener("keypress", () => {
  doc.body = docEle.innerHTML
})

docEle.addEventListener("keyup", () => {
  setTimeout(() => {
    const currentDiv = getCurrentDiv()
    if (currentDiv?.className === "action") doc.mode = "Action"
    if (currentDiv?.className === "character") doc.mode = "Character"
    if (currentDiv?.className === "dialogue") doc.mode = "Dialogue"
  }, 0)
})

docEle.addEventListener("keydown", (ev) => {
  if (ev.ctrlKey && ev.key === "d") {
    ev.preventDefault()
  }
  if (ev.key === "Enter") onEnter()

  if (ev.key === "Tab") {
    ev.preventDefault()
    onTab()
    return
  }

  onAnykeydown(ev)
})
>>>>>>> b489573 (got the basics working)
