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
    files: ['src/**/*.{ts,tsx}'],
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
      ],
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
          ],
        },
      ],
    },
  },
])
