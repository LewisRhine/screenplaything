import { attachSmoothCaret } from "./caret";
import { getCurrentDiv } from "./getCurrentDiv";
import { onKeyDown } from "./mutation";
import { attachPagination } from "./pagination";
import { doc } from "./state/siteState";
import "./charPickerMenu/charPickerMenu";
import "./formateMenu/formateMenu";
import "./style.css";
import { setAction, setSceneHeading } from "./formateMenu/formateMenu";

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
`;

const modeEle = document.getElementById("mode")!;
export const docEle = document.getElementById("doc")!;
attachPagination(docEle, document.getElementById("pages")!);
attachSmoothCaret(docEle);

doc.sub(() => {
  modeEle.innerText = `Mode: ${doc.mode}`;
});

if (doc.body === "") {
  const startDiv = document.createElement("div");
  startDiv.className = "action";
  startDiv.innerHTML = "<br>";
  docEle.append(startDiv);
  docEle.focus();
} else {
  docEle.innerHTML = doc.body;
}

doc.sub(() => {
  if (doc.mode === "Action") {
    const currentDiv = getCurrentDiv()!;
    currentDiv.className = "action";
  }
  if (doc.mode === "Scene Heading") {
    const currentDiv = getCurrentDiv()!;
    currentDiv.className = "scene-heading";
  }
  if (doc.mode === "Character") {
    const currentDiv = getCurrentDiv()!;
    currentDiv.className = "character";
  }
  if (doc.mode === "Dialogue") {
    const currentDiv = getCurrentDiv()!;
    currentDiv.className = "dialogue";
  }
});

docEle.addEventListener("keypress", () => {
  doc.body = docEle.innerHTML;
});

docEle.addEventListener("keydown", (ev) => {
  const { ctrlKey, key, preventDefault } = ev;
  if (ctrlKey && key === "s") {
    preventDefault();
    setSceneHeading();
  }

  if (ctrlKey && key === "a") {
    preventDefault();
    setAction();
  }

  if (ctrlKey && key === "Shift" && !doc.charPickerMenuOpen)
    doc.formateMenuOpen = !doc.formateMenuOpen;

  onKeyDown(ev, getCurrentDiv()!);

  if (
    key === "ArrowUp" ||
    key === "ArrowDown" ||
    key === "ArrowRight" ||
    key === "ArrowLeft"
  ) {
    setTimeout(() => {
      const currentDiv = getCurrentDiv();
      const currentClass = getCurrentDiv()?.className ?? "";
// todo celarn filter and chr menu if not char
      if (currentClass === "scene-heading") doc.mode = "Scene Heading";
      if (currentClass === "action") doc.mode = "Action";
      if (currentClass === "dialogue") doc.mode = "Dialogue";
      if (currentClass === "character") {
        doc.mode = "Character";
        if (currentDiv?.textContent === "" && doc.characters.length > 0) {
          doc.charPickerMenuOpen = true;
        }
      }
    }, 0);
  }
});
