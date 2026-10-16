import "./pagination.css";

interface BlockMeasurement {
  element: HTMLElement;
  top: number;
  height: number;
  lineHeight: number;
}

export function attachPagination(editor: HTMLElement, pages: HTMLElement): void {
  const firstPage = document.createElement("div");
  firstPage.className = "paper-page";
  pages.append(firstPage);
  let frame = 0;
  let composing = false;
  let revealCaret = false;

  function layout() {
    frame = 0;
    if (composing) return;

    const blocks = Array.from(editor.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement);
    for (const block of blocks) {
      block.style.removeProperty("--page-break-space");
      block.style.removeProperty("--page-exclusion-height");
      block.style.removeProperty("--page-exclusion-shape");
      block.removeAttribute("data-page-overflow");
    }

    const editorStyle = getComputedStyle(editor);
    const pageHeight = firstPage.getBoundingClientRect().height;
    const gap = parseFloat(getComputedStyle(pages).rowGap);
    const topMargin = parseFloat(editorStyle.paddingTop);
    const bottomMargin = parseFloat(editorStyle.paddingBottom);
    const contentHeight = pageHeight - topMargin - bottomMargin;
    if (contentHeight <= 0) return;

    const editorTop = editor.getBoundingClientRect().top;
    const measurements: BlockMeasurement[] = blocks.map((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        element,
        top: bounds.top - editorTop,
        height: bounds.height,
        lineHeight: parseFloat(getComputedStyle(element).lineHeight),
      };
    });
    const changes: (() => void)[] = [];
    const stride = pageHeight + gap;
    let pageIndex = 0;
    let shift = 0;

    for (const [index, block] of measurements.entries()) {
      let top = block.top + shift;
      let available = pageIndex * stride + pageHeight - bottomMargin - top;
      let required = block.height;
      const next = measurements[index + 1];
      if (block.element.classList.contains("character")
        && next?.element.classList.contains("dialogue")) {
        const groupHeight = next.top + next.height - block.top;
        required = groupHeight <= contentHeight
          ? groupHeight
          : block.height + next.lineHeight;
      }

      const minimum = required <= contentHeight ? required : block.lineHeight;
      if (minimum > available + 0.5) {
        pageIndex += 1;
        const space = pageIndex * stride + topMargin - top;
        shift += space;
        top += space;
        available = contentHeight;
        changes.push(() => {
          block.element.style.setProperty("--page-break-space", `${space}px`);
        });
      }

      if (block.height > available + 0.5) {
        const points = ["0 0"];
        let remaining = block.height;
        let localTop = 0;
        let exclusionHeight = 0;
        while (remaining > available + 0.5) {
          const used = Math.max(0, Math.floor((available + 0.5) / block.lineHeight))
            * block.lineHeight;
          remaining -= used;
          const gapStart = localTop + used;
          pageIndex += 1;
          const gapEnd = pageIndex * stride + topMargin - top;
          points.push(`0 ${gapStart}px`, `100% ${gapStart}px`,
            `100% ${gapEnd}px`, `0 ${gapEnd}px`);
          shift += gapEnd - gapStart;
          exclusionHeight = gapEnd;
          localTop = gapEnd;
          available = contentHeight;
        }
        points.push("0 0");
        changes.push(() => {
          block.element.setAttribute("data-page-overflow", "");
          block.element.style.setProperty("--page-exclusion-height", `${exclusionHeight}px`);
          block.element.style.setProperty("--page-exclusion-shape", `polygon(${points.join(", ")})`);
        });
      }
    }

    for (const change of changes) change();
    const pageCount = pageIndex + 1;
    while (pages.children.length < pageCount) {
      const page = document.createElement("div");
      page.className = "paper-page";
      pages.append(page);
    }
    while (pages.children.length > pageCount) pages.lastElementChild!.remove();
    const height = `${pageCount * pageHeight + (pageCount - 1) * gap}px`;
    if (editor.style.minHeight !== height) editor.style.minHeight = height;
    editor.dispatchEvent(new Event("paginationchange"));

    const selection = window.getSelection();
    if (revealCaret && document.activeElement === editor
      && selection?.isCollapsed && selection.rangeCount
      && editor.contains(selection.focusNode)) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      if (rect.height > 0) {
        const scroll = rect.bottom > window.innerHeight - 24
          ? rect.bottom - window.innerHeight + 24
          : rect.top < 24 ? rect.top - 24 : 0;
        if (scroll) window.scrollBy(0, scroll);
      }
    }
    revealCaret = false;
  }

  function schedule() {
    if (!frame && !composing) frame = window.requestAnimationFrame(layout);
  }

  editor.addEventListener("input", () => {
    revealCaret = true;
    schedule();
  });
  editor.addEventListener("compositionstart", () => {
    composing = true;
  });
  editor.addEventListener("compositionend", () => {
    composing = false;
    schedule();
  });
  new MutationObserver(schedule).observe(editor, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class"],
  });
  new ResizeObserver(schedule).observe(editor);
  window.addEventListener("resize", schedule);
  void document.fonts.ready.then(schedule);
  schedule();
}
