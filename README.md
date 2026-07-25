# Li Auto Global English EDS

This repository is the deployable AEM Edge Delivery Services implementation for the Li Auto Global English website. It is based on `aem-boilerplate`, uses Universal Editor for authoring, and mounts AEM Cloud Service content through `fstab.yaml`.

Development happens on `main`. A change is considered delivered only after it is pushed to GitHub, the remote Build succeeds, and the remote EDS Preview is checked.

## Project Roles

- `Universal-editor-demo/`: implementation repository. Build blocks, Universal Editor models, styles, and deployable EDS code here.
- `../lixiang2/`: read-only reference repository. Use it for live-site screenshots, extracted content, design requirements, and content models. Do not implement features there unless the user explicitly asks to update reference materials.

The final visual source of truth is the current live Li Auto site at `www.liauto.com`, with `lixiang2` acting as the local reference layer.

## Environments

- Preview: `https://main--universal-editor-demo--yjwu-leadstec.aem.page/`
- Live: `https://main--universal-editor-demo--yjwu-leadstec.aem.live/`
- AEM Author content root: `/content/demo-site`
- Language master used for development and regression: `/content/demo-site/language-master/en`

## Setup

Prerequisites:

- Node.js 18.3.x or newer
- AEM CLI: `npm install -g @adobe/aem-cli`
- Access to the AEM author environment mounted by `fstab.yaml`

Install dependencies:

```sh
npm i
```

Start local EDS proxy:

```sh
aem up
```

The local proxy serves author content at `http://localhost:3000`.

## Common Commands

```sh
npm run lint       # ESLint + Stylelint
npm run lint:js    # JavaScript lint only
npm run lint:css   # CSS lint only
npm run lint:fix   # Auto-fix supported lint issues
npm run build:json # Merge model partials into component-*.json
```

Run commands from this repository root. The Husky pre-commit hook runs `build:json` and stages generated component JSON when model partials change.

## Development Flow

1. Read this repository's `AGENTS.md` and the relevant component manual under `docs/component-manual/`.
2. Use `../lixiang2/` and the live website as references for fields, layout, and breakpoint behavior.
3. Implement the block, model, or style change in this repository only.
4. Run `npm run lint` and any targeted checks needed for the change.
5. Commit to `main`, push to GitHub, wait for the remote Build to pass, and verify the EDS Preview URL.

Local screenshots or `aem up` checks are useful during development, but they are not the final acceptance surface for this project.

## Key Docs

- [Project rules](./AGENTS.md)
- [Component inventory](./docs/component-manual/官网组件清单.md)
- [Media Center v2 manual](./docs/component-manual/Media%20Center%20v2-使用配置手册.md)
- [Navigation manual](./docs/component-manual/导航-使用配置手册.md)
- [Homepage manual](./docs/component-manual/首页-使用配置手册.md)
