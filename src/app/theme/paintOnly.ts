/**
 * Checks that theme parts CSS only paints (ADR 0011): it may change how things look, never their size, spacing or
 * position. Used by `parts.test.ts` on `parts.css`. A small reader for the CSS we write there (rules, `@media`,
 * `@keyframes`, comments), not a full CSS parser.
 */

interface Rule {
  selector: string
  declarations: [property: string, value: string][]
  /** The `@media` conditions around the rule. */
  media: string[]
  /** The animation name, for a frame inside `@keyframes`. */
  keyframes?: string
}

/** Reads CSS into flat rules. */
export function readRules(css: string): Rule[] {
  const rules: Rule[] = []
  const walk = (text: string, media: string[], keyframes?: string) => {
    let at = 0
    while (at < text.length) {
      const open = text.indexOf('{', at)
      if (open < 0) break
      const prelude = text.slice(at, open).trim()
      // Find the matching close brace.
      let depth = 1
      let close = open + 1
      for (; close < text.length && depth > 0; close++) {
        if (text[close] === '{') depth++
        if (text[close] === '}') depth--
      }
      const body = text.slice(open + 1, close - 1)
      if (prelude.startsWith('@media')) walk(body, [...media, prelude.slice(6).trim()], keyframes)
      else if (prelude.startsWith('@keyframes')) walk(body, media, prelude.slice(10).trim())
      else {
        const declarations = body
          .split(';')
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => {
            const colon = part.indexOf(':')
            return [part.slice(0, colon).trim().toLowerCase(), part.slice(colon + 1).trim()] as [string, string]
          })
        rules.push({ selector: prelude, declarations, media, keyframes })
      }
      at = close
    }
  }
  walk(css.replace(/\/\*[\s\S]*?\*\//g, ''), [])
  return rules
}

/** Properties that change size, spacing, flow or position: never allowed on an element itself. */
const layout =
  /^(width|height|min-|max-|inline-size|block-size|padding|margin|gap|row-gap|column-gap|display|flex|grid|order|float|clear|font-size|font|line-height|letter-spacing|word-spacing|text-indent|white-space|border(-(top|right|bottom|left))?(-width)?$|border-(top|right|bottom|left)$|inset|top|right|bottom|left|position|overflow|aspect-ratio|zoom|columns|box-sizing|vertical-align)/

/** What a keyframe may move: things phones animate without laying the page out again. */
const animatable = /^(transform|opacity|background-position)$/

const isDecoration = (selector: string) => /::?(before|after)\b/.test(selector)
const calm = (media: string[]) => media.some((condition) => /prefers-reduced-motion:\s*no-preference/.test(condition))

/** Every rule break in some theme parts CSS, as readable messages. Empty means it only paints. */
export function paintOnlyProblems(css: string): string[] {
  const problems: string[] = []
  for (const { selector, declarations, media, keyframes } of readRules(css)) {
    const where = keyframes ? `@keyframes ${keyframes} ${selector}` : selector
    const props = new Map(declarations)

    for (const [property, value] of declarations) {
      if (keyframes) {
        if (!animatable.test(property)) problems.push(`${where}: keyframes may only animate transform, opacity or background-position, not ${property}`)
        continue
      }
      if ((property === 'animation' || property.startsWith('animation-') || property === 'transition') && value !== 'none' && !calm(media)) {
        problems.push(`${where}: ${property} must be inside @media (prefers-reduced-motion: no-preference)`)
      }
      if (isDecoration(selector)) continue // a decoration layer takes no space, so it may size and place itself
      if (property === 'position' && value === 'relative') continue // lets a card hold its decorations; moves nothing
      if (layout.test(property)) problems.push(`${where}: ${property} changes layout; parts may only paint`)
    }

    if (!keyframes && isDecoration(selector)) {
      if (!/^(absolute|fixed)$/.test(props.get('position') ?? '')) problems.push(`${where}: a decoration must be position: absolute or fixed`)
      if (props.get('pointer-events') !== 'none') problems.push(`${where}: a decoration must have pointer-events: none`)
    }
  }
  return problems
}
