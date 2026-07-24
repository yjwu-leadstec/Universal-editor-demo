## Context

Pencil section `3 / 内容展示` defines a product introduction carousel with responsive titles, optional grouped highlights above the media, responsive image/video slides, an optional attached metric strip below the media, tab copy, and horizontal desktop / vertical mobile navigation. The existing block mixes this design with source-family layout variants and uses one flat stat item for two semantically different structures.

## Goals / Non-Goals

- Goals: preserve real L6 layouts, model the two metric structures accurately, make all optional content gap-free, align desktop/mobile visuals, rename every existing AEM node, and retire the legacy runtime entry.
- Non-Goals: add the unused Pencil thumbnail field or change the read-only `lixiang2` reference repository.

## Decisions

- The canonical container is `lixiang-product-intro-carousel`; child models use the same namespace.
- `topList` is represented as highlight groups containing highlight items, preserving `topSublist` grouping.
- `bottomList` is represented as a separate metric item collection attached below the media.
- The source-backed layout variants remain. `overlay-tabs` is absent from AEM content and is removed from both authoring and runtime.
- A small legacy loader adapter keeps published `feature-media-section` content working only between the first code deployment and the content migration. It is removed in the final deployment.
- The component relies on the shared product spacing classes instead of overriding them at intermediate breakpoints.

## Risks / Trade-offs

- The staged rollout briefly retains the old runtime adapter so content migration cannot create a code/content mismatch.
- Moving JCR nodes changes their paths, so the migration must update container and child model metadata and verify the complete `/content/demo-site` subtree before removing the adapter.
- Bottom metrics are generic capability supported by the source corpus, but current L6 content has none; tests therefore validate structure and styling rather than current-page authored data.

## Migration Plan

1. Tag the pre-change commit.
2. Add the canonical block/model and compatibility adapter.
3. Update local fixtures/docs and generated component JSON.
4. Deploy the canonical block with the temporary adapter.
5. Migrate every AEM container and child node under `/content/demo-site`, including node names and model metadata.
6. Publish and verify migrated pages, then confirm the old model query returns zero nodes.
7. Remove the adapter and legacy parser mappings, deploy again, and repeat delivery verification.
