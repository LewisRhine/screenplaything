import { getCurrentDiv } from "../getCurrentDiv";
import { doc } from "../state/siteState";

const formateMenu = document.createElement("ul");
formateMenu.className = "suggest-menu";
formateMenu.innerHTML = `
    <li data-value="Scene-Heading" class="highlighted">s > Scene Heading</li>
    <li data-value="Action">a > Action</li>
    <li data-value="Character">c > Character</li>
  `;

doc.sub(() => {
  doc.formateMenuOpen
    ? getCurrentDiv()?.append(formateMenu)
    : formateMenu.remove();

  const index = doc.formateMenuIndex;
  const suggest = formateMenu.children[doc.formateMenuIndex];

  formateMenu.children[index - 1]?.classList.remove("highlighted");
  formateMenu.children[index + 1]?.classList.remove("highlighted");
  suggest?.classList.add("highlighted");
});

export function formateMenuKeys(ev: KeyboardEvent) {
  const { key } = ev;

  if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowRight") {
    ev.preventDefault();
  }

  if (key === "ArrowUp" && doc.formateMenuIndex > 0) doc.formateMenuIndex--;

  if (
    key === "ArrowDown" &&
    doc.formateMenuIndex < doc.formateMenuItems.length - 1
  ) {
    doc.formateMenuIndex++;
  }

  if (key === "s") {
    ev.preventDefault();
    doc.formateMenuOpen = false;
    setSceneHeading();
  }

  if (key === "Enter") {
    ev.preventDefault();
    doc.formateMenuOpen = false;
    const formateMenuItem = doc.formateMenuItems[doc.formateMenuIndex];
    if (formateMenuItem) doc.mode = formateMenuItem;
  }

  if (key === "Escape") doc.formateMenuOpen = false;
}

export function setSceneHeading() {
  if (doc.mode === "Scene Heading") return;
  doc.mode = "Scene Heading";
}

export function setAction() {
  if (doc.mode === "Action") return;
  doc.mode = "Action";
}
