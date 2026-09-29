import { newState } from "./state";
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

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<section id="center">
  <div id="mode" class="hero">Mode: </div>
  <div id="doc" class="doc" tabindex="-1" contenteditable="true"></div>
  <div id="hint"></div>
</section>
`;

const modeEle = document.getElementById("mode")!;
const docEle = document.getElementById("doc")!;
const hintEle = document.getElementById("hint")!;

const startDiv = document.createElement("div");
startDiv.innerHTML = "<br>";
startDiv.className = "action";
docEle.append(startDiv);
docEle.focus();

doc.sub(() => {
  modeEle.innerText = `Mode: ${doc.mode}`;
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
  doc.body = docEle.innerText;
});

docEle.addEventListener("keydown", (ev) => {
  if (ev.ctrlKey && ev.key === " ") {
    const cur = getCurrentDiv();
    console.log(cur?.textContent);
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
        console.log(doc.characters);
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
      console.log(currentDiv.textContent);
      console.log(currentDiv.innerText);

      const filter = doc.characters.filter((value) =>
        value.toUpperCase().includes(currentDiv.innerText),
      );
      hintEle.innerText = filter.toString();
    }, 0);
  }
});

doc.sub(() => {
  doc.characters.forEach((element) => {
    console.log(element);
  });

  // docEle.innerText = doc.body
});
