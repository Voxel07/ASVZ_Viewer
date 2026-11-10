# React + TypeScript + Vite

## Local development

Run `npm run dev` to start the local Vite app. The viewer defaults to the
production PocketBase at `https://pb.matzeschneider.de`; use
`VITE_POCKETBASE_URL` in `.env.local` to override it. Authenticated screens use
the normal Login / Authentik flow in the local browser.

Below 600px, listings and alerts use cards, filters fill the available width,
and listing history / trend drill-down dialogs fill the screen. Below 1200px,
navigation moves onto a separate row. Check Dashboard, Marketplace (list and
details), Search (list, details, and trends), Alerts, and their dialogs when
changing these layouts. Local validation screenshots can be stored in `tmp/`.

## Docker

The Dockerfile builds the frontend with Bun and serves the resulting static files
with nginx; a local `dist` directory is not required.

```sh
docker build --pull -t asvz-viewer:local .
docker run --rm -p 8080:80 asvz-viewer:local
```

To change the PocketBase server, pass
`--build-arg VITE_POCKETBASE_URL=https://your-pocketbase.example` when building.
Vite embeds this setting in the generated assets, so setting the variable on an
already-built container does not change the server URL. The image includes an
HTTP health check on port 80.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
