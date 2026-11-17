/**
 * Registers every bundled font in `src/sdk/theme/fonts.ts` (ADR 0010). Each import adds `@font-face` rules only: the
 * browser downloads a font file when text on the page uses that font, and only the file for the alphabet it needs.
 * So a font no theme picks costs a few lines of CSS, not a download.
 */
import '@fontsource-variable/caveat'
import '@fontsource-variable/nunito'
