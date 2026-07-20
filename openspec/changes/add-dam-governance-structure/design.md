## Context

The architecture document defines Global and Central Asia as parallel governance domains. Global manages Global English, UAE, SA, NL, and KW; Central Asia manages KZ and UZ. Digital assets are centrally managed and referenced by page components. Dynamic Media is not in use.

The active Homepage contains 43 asset-valued component properties resolving to 41 unique binaries: seven desktop vehicle images, seven mobile vehicle images, seven vehicle logos, three hero images, one additional MEGA logo variant, three story posters, three story videos, two brand panels, and eight technology images.

## Goals / Non-Goals

- Goals:
  - Establish stable DAM governance and future ACL inheritance boundaries.
  - Use the active `eds-reference` media as the migration source.
  - Avoid duplicate binaries for language-neutral media.
  - Preserve current Universal Editor component contracts.
  - Provide a reversible Homepage migration.
- Non-Goals:
  - Configure Dynamic Media, Scene7 URLs, Smart Crop, or DM profiles.
  - Invent final IMS/AEM user groups or per-user ACLs.
  - Migrate product pages, legal documents, nav, or footer assets.
  - Upload unused `eds-reference` media.

## Decisions

### Governance tree

```text
/content/dam/li-auto
├── shared
│   ├── brand/homepage/{stories,lifestyle}
│   ├── vehicles/{li-i6,li-i8,li-mega,li-l6,li-l7,li-l8,li-l9}/homepage
│   ├── technology/homepage
│   ├── corporate
│   └── documents
├── global
│   ├── site/en/{media,documents}
│   └── markets/{ae,sa,nl,kw}/<language>/{media,documents}
├── central-asia
│   └── markets/{kz,uz}/<language>/{media,documents}
├── intake/{global,central-asia}
└── archive/{shared,global,central-asia}
```

Folders represent stable ownership, default metadata, and future ACL inheritance boundaries. Search concerns such as asset role and page usage remain metadata concerns rather than additional folder depth.

### Homepage placement

- Vehicle tile, hero, and logo media live with the corresponding vehicle under `shared/vehicles/<model>/homepage`.
- Story posters and videos live under `shared/brand/homepage/stories`.
- The two brand proposition panels live under `shared/brand/homepage/lifestyle`.
- Technology cards live under `shared/technology/homepage`.
- Market/language folders remain available for genuine localized variants but are not populated with duplicate Homepage binaries.

### Naming

- AEM node names use lowercase ASCII kebab-case and preserve the source extension.
- Desktop/mobile suffixes are used only where the active content model has distinct assets.
- Opaque source UUIDs are retained as source URL metadata or migration evidence, not as target filenames.

### Metadata

- Uploaded assets receive at least `dc:title`, `dc:description`, `dc:language=und`, `dc:source`, and `xmpRights:UsageTerms` where supported.
- The physical path supplies the initial governance scope. A project namespace and folder Metadata Profiles remain a later code/configuration package once field ownership is approved.

## Data Flow

```text
eds-reference URL
  -> validate status, MIME type, and source uniqueness
  -> upload one binary to /content/dam/li-auto/shared/...
  -> verify dam:Asset and processing status
  -> update exact Homepage component property
  -> publish/preview
  -> verify asset responses and rendered Homepage
```

## Migration and Rollback

1. Create the complete folder skeleton before uploading assets.
2. Upload and verify all 41 unique assets before changing any page reference.
3. Create an AEM page version before switching references when the connected identity permits it; otherwise persist the complete old-to-new property map before switching.
4. Update the 43 Homepage asset properties in one controlled batch.
5. Verify no Homepage property still references `/content/dam/li-demo`.
6. Validate Author/Preview at desktop and mobile widths; the Homepage Banner must remain visible.
7. Roll back by restoring the page version or replaying the captured old property map. The connected technical account did not permit version creation in Dev, so `migration-manifest.md` is the authoritative rollback map. Do not delete `/content/dam/li-demo` in this change.

## Risks / Trade-offs

- Standard AEM processing of large MP4 files may be asynchronous; page references must not switch until asset nodes exist and are readable.
- The current Banner model has no mobile image field. The migration preserves the model and does not upload unused banner-only mobile variants.
- Final group names, Metadata Profiles, approval workflows, retention policy, and rights ownership are still TBD and do not block the path-based first migration.
