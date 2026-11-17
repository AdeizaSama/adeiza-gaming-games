/**
 * Checks every content pack in src/games and every theme in src/themes, the same way the app does, and prints what's
 * wrong in plain words.
 * Run with `pnpm validate-content`. CI runs it on every pull request; it exits with code 1 if anything is wrong.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadGameSchema, type GameSchema } from './lib/gameSchema'
import { findGames } from './lib/games'
import { checkPackFile, checkThemeFile } from './lib/validate'

const root = fileURLToPath(new URL('..', import.meta.url))
const games = findGames(join(root, 'src', 'games'))

/** A path as contributors see it in the repo, with forward slashes on every OS. */
const shown = (file: string) => relative(root, file).replaceAll('\\', '/')

let problemCount = 0
let badFiles = 0

/** Prints a file's problems under its name and counts them. */
function report(file: string, problems: { path: string; message: string }[]): void {
  badFiles++
  problemCount += problems.length
  console.log(`  ✗ ${shown(file)}`)
  for (const { path, message } of problems) console.log(`      ${path ? `${path}: ` : ''}${message}`)
}

console.log('Checking content packs\n')

for (const game of games) {
  console.log(game.id)

  if (!game.schemaFile) {
    if (game.packFiles.length > 0) report(join(root, 'src', 'games', game.id), [{ path: '', message: 'Has packs but no schema.ts to check them against' }])
    else console.log('  (no schema.ts and no packs yet)')
    continue
  }

  let schema: GameSchema
  try {
    schema = await loadGameSchema(game.schemaFile)
  } catch (error) {
    report(game.schemaFile, [{ path: '', message: (error as Error).message }])
    continue
  }

  if (game.packFiles.length === 0) console.log('  (no packs yet)')

  for (const file of game.packFiles) {
    const result = checkPackFile(game.id, file, readFileSync(file, 'utf8'), schema)
    if (result.problems.length > 0) report(file, result.problems)
    else console.log(`  ✓ ${shown(file)} (${result.items} items)`)
  }
}

if (games.length === 0) console.log('No games found.')

console.log('\nChecking themes\n')

const themesDir = join(root, 'src', 'themes')
const themeFiles = existsSync(themesDir)
  ? readdirSync(themesDir).filter((name) => name.endsWith('.json')).sort().map((name) => join(themesDir, name))
  : []
for (const file of themeFiles) {
  const problems = checkThemeFile(file, readFileSync(file, 'utf8'))
  if (problems.length > 0) report(file, problems)
  else console.log(`  ✓ ${shown(file)}`)
}
if (themeFiles.length === 0) console.log('  (no themes yet)')

if (problemCount > 0) {
  console.log(`\n${problemCount} problem${problemCount === 1 ? '' : 's'} in ${badFiles} file${badFiles === 1 ? '' : 's'}.`)
  console.log('The rules for packs and themes are in CONTRIBUTING.md, under "Add or improve content" and "Add a theme".')
  process.exitCode = 1
} else {
  console.log('\nAll packs and themes are valid.')
}
