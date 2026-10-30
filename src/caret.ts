import "./caret.css"
import { caretPosition, type CaretPosition } from "./state/siteState"

// interface CaretPosition {
//   left: number;
//   top: number;
//   height: number;
// }

function measureCaret(range: Range, editor: HTMLElement): CaretPosition | null {
  const rect = Array.from(range.getClientRects()).find((rect) => rect.height > 0)
  if (rect) return { left: rect.left, top: rect.top, height: rect.height }

  const container = range.startContainer
  if (container.nodeType === Node.TEXT_NODE && container.textContent?.length) {
    const adjacent = range.cloneRange()
    const offset = range.startOffset
    adjacent.setStart(container, offset > 0 ? offset - 1 : 0)
    adjacent.setEnd(container, offset > 0 ? offset : 1)
    const rects = Array.from(adjacent.getClientRects())
    const adjacentRect = offset > 0 ? rects.at(-1) : rects[0]
    if (!adjacentRect?.height) return null
    const direction = getComputedStyle(container.parentElement!).direction
    const useRightEdge = offset > 0 !== (direction === "rtl")
    return {
      left: useRightEdge ? adjacentRect.right : adjacentRect.left,
      top: adjacentRect.top,
      height: adjacentRect.height,
    }
  }

  const element = container.nodeType === Node.ELEMENT_NODE ? (container as HTMLElement) : container.parentElement
  if (!element || !editor.contains(element)) return null

  const child = element.childNodes[range.startOffset] ?? element.childNodes[range.startOffset - 1]
  if (child && child.nodeName !== "BR" && child !== container) {
    const boundary = document.createRange()
    boundary.selectNodeContents(child)
    boundary.collapse(range.startOffset < element.childNodes.length)
    return measureCaret(boundary, editor)
  }

  const block = element.closest<HTMLElement>("div, p, li")
  if (!block || !editor.contains(block) || block.textContent) return null
  const placeholder = block.querySelector("br")
  if (placeholder) {
    const placeholderRange = document.createRange()
    placeholderRange.selectNode(placeholder)
    const placeholderRect = Array.from(placeholderRange.getClientRects()).find((rect) => rect.height > 0)
    if (placeholderRect) {
      return {
        left: placeholderRect.left,
        top: placeholderRect.top,
        height: placeholderRect.height,
      }
    }
  }

  const style = getComputedStyle(block)
  const bounds = block.getBoundingClientRect()
  const left = bounds.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft)
  const right = bounds.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight)
  const centered = style.textAlign === "center"
  const rightAligned =
    style.textAlign === "right" ||
    (style.textAlign === "start" && style.direction === "rtl") ||
    (style.textAlign === "end" && style.direction !== "rtl")
  const height = parseFloat(style.fontSize)
  const lineHeight = parseFloat(style.lineHeight) || height * 1.2
  return {
    left: centered ? (left + right) / 2 : rightAligned ? right : left,
    top: bounds.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop) + (lineHeight - height) / 2,
    height,
  }
}

export function attachSmoothCaret(editor: HTMLElement): void {
  const caret = document.createElement("div")
  caret.className = "smooth-caret"
  caret.setAttribute("aria-hidden", "true")
  caret.append(document.createElement("span"))
  caret.hidden = true
  document.body.append(caret)

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
  let composing = false
  let frame = 0
  let idleTimer = 0
  let snap = true
  let previous: CaretPosition | null = null

  function hide() {
    caret.hidden = true
    caret.classList.remove("has-trail", "is-moving")
    window.clearTimeout(idleTimer)
    if (editor.classList.contains("smooth-caret-active")) {
      editor.classList.remove("smooth-caret-active")
    }
    previous = null
  }

  function update() {
    frame = 0
    const selection = window.getSelection()
    if (
      reducedMotion.matches ||
      composing ||
      document.activeElement !== editor ||
      !document.hasFocus() ||
      !selection?.isCollapsed ||
      !selection.rangeCount ||
      !editor.contains(selection.anchorNode)
    ) {
      hide()
      return
    }

    const position = measureCaret(selection.getRangeAt(0), editor)
    if (
      !position ||
      position.top + position.height < 0 ||
      position.top > window.innerHeight ||
      position.left < 0 ||
      position.left > window.innerWidth
    ) {
      hide()
      return
    }

    caretPosition.height = position.height
    caretPosition.left = position.left
    caretPosition.top = position.top

    const moved =
      !previous ||
      position.left !== previous.left ||
      position.top !== previous.top ||
      position.height !== previous.height
    if (moved || snap) {
      const animate = !snap && previous !== null
      if (animate) {
        const displayed = caret.getBoundingClientRect()
        const deltaX = displayed.left - position.left
        const deltaY = displayed.top - position.top
        const distance = Math.hypot(deltaX, deltaY)
        const scale = Math.min(1, 24 / Math.max(distance, 1))
        caret.style.setProperty("--trail-x", `${deltaX * scale}px`)
        caret.style.setProperty("--trail-y", `${deltaY * scale}px`)
        caret.classList.toggle("has-trail", distance > 0.5)
      } else {
        caret.classList.remove("has-trail")
        caret.style.setProperty("--trail-x", "0px")
        caret.style.setProperty("--trail-y", "0px")
      }
      caret.style.transition = animate ? "" : "none"
      caret.style.transform = `translate3d(${position.left}px, ${position.top}px, 0)`
      caret.style.height = `${position.height}px`
      caret.classList.add("is-moving")
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        caret.classList.remove("is-moving", "has-trail")
      }, 120)
    }
    caret.style.color = getComputedStyle(editor).color
    caret.hidden = false
    if (!editor.classList.contains("smooth-caret-active")) {
      editor.classList.add("smooth-caret-active")
    }
    previous = position
    snap = false
  }

  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(update)
  }

  function reposition() {
    snap = true
    schedule()
  }

  document.addEventListener("selectionchange", schedule)
  editor.addEventListener("input", schedule)
  editor.addEventListener("paginationchange", schedule)
  editor.addEventListener("focus", reposition)
  editor.addEventListener("blur", hide)
  window.addEventListener("blur", hide)
  window.addEventListener("focus", reposition)
  editor.addEventListener("compositionstart", () => {
    composing = true
    hide()
  })
  editor.addEventListener("compositionend", () => {
    composing = false
    reposition()
  })
  document.addEventListener("scroll", reposition, true)
  window.addEventListener("resize", reposition)
  window.visualViewport?.addEventListener("resize", reposition)
  window.visualViewport?.addEventListener("scroll", reposition)
  reducedMotion.addEventListener("change", reposition)
  new ResizeObserver(reposition).observe(editor)
  new MutationObserver(schedule).observe(editor, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  })
  void document.fonts.ready.then(reposition)
  schedule()
}
