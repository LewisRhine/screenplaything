import { docEle } from "../main";
import { doc } from "../state/siteState";

export const charPickerMenu = document.createElement("ul");
charPickerMenu.id = "suggest-menu";
charPickerMenu.className = "suggest-menu";

doc.sub(() => {
  if (doc.mode !== "Character") doc.charPickerMenuOpen = false;

  doc.charPickerMenuOpen
    ? docEle.append(charPickerMenu)
    : charPickerMenu.remove();

  if (!doc.charPickerMenuOpen) return;

  const index = doc.charPickerMenuIndex;
  const char = charPickerMenu.children[doc.charPickerMenuIndex];

  charPickerMenu.children[index - 1]?.classList.remove("highlighted");
  charPickerMenu.children[index + 1]?.classList.remove("highlighted");
  char?.classList.add("highlighted");
});

doc.sub(() => {
  // todo make more better!
  charPickerMenu.innerHTML = "";

  const chars =
    doc.charactersFilter.length > 0 ? doc.charactersFilter : doc.characters;

  chars.forEach((char) => {
    charPickerMenu.innerHTML += `<li data-value="${char}">${char}</li>`;
  });
});


export function charPickerMenuKeys(ev: KeyboardEvent, currentElement: HTMLDivElement) {
  const { key } = ev;
  
  if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowRight") {
    ev.preventDefault();
  }

  if (key === "ArrowUp" && doc.charPickerMenuIndex > 0) {
    doc.charPickerMenuIndex--;
  }

  if (
    key === "ArrowDown" &&
    doc.charPickerMenuIndex < doc.characters.length - 1
  ) {
    doc.charPickerMenuIndex++;
  }

  if (key === "Enter") {
    setTimeout(() => {
      currentElement.textContent =
        doc.characters[doc.charPickerMenuIndex] ?? "";
    }, 0);

    // this feels bad! make find better way
    setTimeout(() => {
      doc.mode = "Dialogue";
    }, 1);
  }
}
