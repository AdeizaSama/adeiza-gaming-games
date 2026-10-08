import js from '@eslint/js'
import boundaries from 'eslint-plugin-boundaries'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist']),

  // General JavaScript and TypeScript rules.
  js.configs.recommended,
  tseslint.configs.recommended,

  // React rules: hooks are called in the same order every render, and effects list their dependencies.
  reactHooks.configs.flat.recommended,

  // Folder boundaries (Game Standard §9).
  {
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.ts'],
    plugins: { boundaries },
    settings: {
      // Lets the plugin follow TypeScript imports to the real file, so rules see where an import actually points.
      'import/resolver': { typescript: true },
      // Every folder that matters, by type. The first matching pattern wins, so the registry comes before the rest of app/.
      'boundaries/elements': [
        { type: 'registry', pattern: 'src/app/registry' },
        { type: 'app', pattern: 'src/app' },
        { type: 'sdk', pattern: 'src/sdk' },
        { type: 'ui', pattern: 'src/ui' },
        // capture: remembers which game a file belongs to, so a rule can say "same game only".
        { type: 'game', pattern: 'src/games/*', capture: ['gameId'] },
        { type: 'scripts', pattern: 'scripts' },
      ],
      // Single files that need their own rules. Elements (above) are folders; a file can also have a category.
      // A game's schema.ts is still part of its game, but scripts may load it on its own.
      'boundaries/files': [{ category: 'game-schema', pattern: 'src/games/*/schema.ts' }],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          // Anything not allowed below is an error.
          default: 'disallow',
          policies: [
            // app/ uses the SDK, UI components and the registry. It never imports a game directly.
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { types: { anyOf: ['app', 'registry', 'sdk', 'ui'] } } } },
            },
            // The registry is the one place that lists the games.
            {
              from: { element: { type: 'registry' } },
              allow: { to: { element: { types: { anyOf: ['game', 'sdk'] } } } },
            },
            // sdk/ never imports from games/ or app/.
            {
              from: { element: { type: 'sdk' } },
              allow: { to: { element: { types: { anyOf: ['sdk', 'ui'] } } } },
            },
            // ui/ is the lowest level: it imports only itself.
            {
              from: { element: { type: 'ui' } },
              allow: { to: { element: { type: 'ui' } } },
            },
            // A game imports the SDK, UI components, and its own files. Never another game.
            {
              from: { element: { type: 'game' } },
              allow: { to: { element: { types: { anyOf: ['sdk', 'ui'] } } } },
            },
            {
              from: { element: { type: 'game' } },
              allow: {
                to: { element: { type: 'game', captured: { gameId: '{{from.element.captured.gameId}}' } } },
              },
            },
            // Scripts use the SDK and games' schema.ts files, never a game's other files or the app.
            {
              from: { element: { type: 'scripts' } },
              allow: { to: { element: { types: { anyOf: ['scripts', 'sdk'] } } } },
            },
            {
              from: { element: { type: 'scripts' } },
              allow: { to: { element: { type: 'game' }, file: { categories: 'game-schema' } } },
            },
          ],
        },
      ],
    },
  },

  // A game's schema.ts stands alone, so scripts can load it without the rest of the game (standard §9).
  // It may import zod and src/sdk/ (`../../sdk/…`); not its own game's other files (`./…`) or React.
  {
    files: ['src/games/*/schema.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['./*', 'react', 'react/*', 'react-dom', 'react-dom/*'],
              message: 'schema.ts may only import zod and src/sdk/: scripts load it without the rest of the game.',
            },
          ],
        },
      ],
    },
  },
])
