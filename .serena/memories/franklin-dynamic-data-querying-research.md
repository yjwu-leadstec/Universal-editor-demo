# Franklin/AEM Dynamic Data Querying and Filtering - Comprehensive Research

**Date**: November 21, 2025  
**Project**: AEM Universal Editor Demo  
**Focus**: Implementing dynamic data querying and filtering in Franklin blocks

---

## Executive Summary

Franklin blocks currently support **static data rendering** from AEM CRX/DE through the Franklin Delivery API. The system does **NOT include built-in query APIs or GraphQL**, but provides multiple patterns for implementing dynamic data fetching and client-side filtering. The most practical approaches involve:

1. **JSON data files** stored in AEM DAM and exposed via the `.json` endpoint
2. **Fragment blocks** that fetch pre-rendered HTML content
3. **Client-side fetch()** calls combined with JavaScript filtering
4. **Query index** generation via helix-query.yaml for searchable content

---

## 1. DATA STORAGE PATTERNS IN AEM FOR FRANKLIN

### A. Current Configuration in Project

**paths.json** (lines 1-10):
```json
{
  "mappings": [
    "/content/demo-site/:/",
    "/content/dam/demo-site/dummy-data/rt5760_series.json:/.helix/config.json",
    "/content/demo-site/metadata:/metadata.json"
  ],
  "includes": [
    "/content/demo-site/",
    "/content/dam/demo-site/dummy-data/"
  ]
}
```

**Key Points**:
- `/content/demo-site/` = Root web content (pages, blocks)
- `/content/dam/demo-site/dummy-data/` = Data assets (JSON files)
- Maps DAM JSON to web-accessible endpoints (e.g., `rt5760_series.json` → `/.helix/config.json`)
- `includes` array exposes paths for Edge Delivery processing

### B. Data Storage Strategies

#### Strategy 1: JSON Files in AEM DAM
**Location**: `/content/dam/demo-site/dummy-data/`  
**Usage**: Static data exposed via `.json` endpoint  
**Example Structure**:
```
/content/dam/demo-site/dummy-data/
├── users-list.json          # Fetched as /content/dam/demo-site/dummy-data/users-list.json
├── products-catalog.json
└── rt5760_series.json       # Mapped to /.helix/config.json
```

**Access Pattern**:
```javascript
// Fetch JSON file from DAM
const response = await fetch('/content/dam/demo-site/dummy-data/users-list.json');
const data = await response.json();
```

#### Strategy 2: Markdown Pages with Metadata
**Pattern**: Store structured data in page markdown with metadata extraction  
**Implementation**: Fragment block loads page content, client-side JS extracts data

#### Strategy 3: HTML Tables (Spreadsheet Pattern)
**Used by**: Cards block, columns block  
**Pattern**: Data in structured rows/columns, parsed by decoration function  
**Example** (from cards.js):
```javascript
// Data comes as rows, transformed to ul/li structure
[...block.children].forEach((row) => {
  const li = document.createElement('li');
  moveInstrumentation(row, li);
  while (row.firstElementChild) li.append(row.firstElementChild);
  // ... transform row data
});
```

#### Strategy 4: Content Fragments (Recommended for Complex Data)
**Pattern**: Use AEM Content Fragments with structured fields  
**Exposed via**: Fragment API endpoints  
**Advantage**: Best for queryable, strongly-typed data

---

## 2. QUERY MECHANISMS AVAILABLE

### A. Franklin Delivery API (What Exists)

**Endpoint Pattern**: `/bin/franklin.delivery/{owner}/{repo}/{branch}`  
**Purpose**: Converts AEM content (markdown, HTML) to Franklin-compatible markup  
**Configuration** (fstab.yaml):
```yaml
mountpoints:
  /:
    url: "https://author-p80707-e1685574.adobeaemcloud.com/bin/franklin.delivery/yjwu-leadstec/Universal-editor-demo/main"
    type: "markup"
    suffix: ".html"
```

**Capabilities**:
- Serves content as HTML with `.html` suffix
- Supports `.plain.html` for plain text variant (used by fragment block)
- Image optimization parameters: `?width=750&format=webply&optimize=medium`
- **NO built-in query filtering**

### B. .json Endpoint Pattern (What We Use)

**Pattern**: Files with `.json` suffix automatically served as JSON  
**Usage**:
```javascript
// Directly fetch JSON files
const users = await fetch('/content/dam/demo-site/dummy-data/users-list.json').then(r => r.json());

// Or mapped endpoints
const config = await fetch('/.helix/config.json').then(r => r.json());
```

**Advantages**:
- Simple HTTP GET
- Cacheable by CDN
- No authentication needed (for public content)
- Lightweight

**Limitations**:
- No server-side filtering
- No query parameters support
- Static JSON files only

### C. Query Index (helix-query.yaml)

**File**: helix-query.yaml (lines 1-15)  
**Purpose**: Generates searchable index at `/query-index.json`

```yaml
indices:
  pages:
    include: ['/**']
    exclude: ['/**.json']
    target: /query-index.json
    properties:
      lastModified:
        select: head > meta[name="robots"]
        value: attribute(el, "content")
```

**Usage**:
```javascript
// Fetch the query index
const index = await fetch('/query-index.json').then(r => r.json());

// Client-side filtering
const results = index.data.filter(page => {
  return page.path.includes('/users');
});
```

**Capabilities**:
- Extracts page metadata (title, robots, custom meta tags)
- Generates searchable index automatically
- Can add custom properties via CSS selectors
- **NOTE**: Excludes `.json` files by default

### D. What Doesn't Exist

- **No GraphQL** - Franklin doesn't include GraphQL
- **No REST APIs** - No POST/PUT endpoints for querying
- **No Server-side Filtering** - All filtering must be client-side
- **No Query Parameters** - Can't do `/users?filter=username:wu`
- **No Database** - No persistent data store (uses Git + AEM)

---

## 3. CLIENT-SIDE FILTERING PATTERNS

### A. Fragment Block Pattern (Data Loading)

**File**: blocks/fragment/fragment.js (lines 20-44)

```javascript
export async function loadFragment(path) {
  if (path && path.startsWith('/')) {
    path = path.replace(/(\.plain)?\.html/, '');
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();

      // Reset base path for media
      const resetAttributeBase = (tag, attr) => {
        main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
          elem[attr] = new URL(elem.getAttribute(attr), 
                               new URL(path, window.location)).href;
        });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      decorateMain(main);
      await loadSections(main);
      return main;
    }
  }
  return null;
}
```

**Pattern**:
1. Fetch HTML content via `.plain.html`
2. Parse into DOM
3. Fix relative URLs
4. Decorate blocks
5. Return parsed content

**Filtering Application** - Can be added after fetch:
```javascript
const fragment = await loadFragment(path);
// Add filtering here:
const items = fragment.querySelectorAll('[data-username]');
const filtered = [...items].filter(item => 
  item.getAttribute('data-username').includes('wu')
);
```

### B. Cards Block Pattern (Data Iteration)

**File**: blocks/cards/cards.js (lines 4-15)

```javascript
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) 
        div.className = 'cards-card-image';
      else 
        div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
}
```

**Pattern for Filtering**:
```javascript
export default function decorate(block) {
  const ul = document.createElement('ul');
  const filterValue = block.getAttribute('data-filter'); // e.g., 'wu'
  
  [...block.children].forEach((row) => {
    // Extract username from row
    const username = row.querySelector('[data-username]')?.textContent.trim();
    
    // Apply filter
    if (filterValue && !username.includes(filterValue)) {
      return; // Skip this item
    }
    
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    // ... rest of decoration
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
}
```

### C. Avatar Block Pattern (Data Extraction)

**File**: blocks/avatar/avatar.js (lines 18-40)

The avatar block demonstrates extracting data from rows:
```javascript
rows.forEach((row) => {
  const text = row.textContent.trim().toLowerCase();

  // First row with picture is the image
  if (!imageRow && row.querySelector('picture')) {
    imageRow = row;
  } else if (text === 'small' || text === 'medium' || text === 'large') {
    sizeValue = text;
  } else if (row.textContent.trim() && 
             text !== 'small' && text !== 'medium' && text !== 'large') {
    if (!nameRow) {
      nameRow = row;
    } else if (!titleRow) {
      titleRow = row;
    }
  }
});
```

**Filtering Pattern**:
```javascript
const filteredRows = rows.filter(row => {
  const username = row.querySelector('[data-username]')?.textContent;
  return username && username.includes('wu');
});
```

---

## 4. FETCH AND JSON PATTERNS IN EXISTING CODE

### A. Fragment Block Fetch Pattern

**Location**: blocks/fragment/fragment.js:24
```javascript
const resp = await fetch(`${path}.plain.html`);
```

### B. Header Block Dynamic Loading

**Location**: blocks/header/header.js:112-114
```javascript
const navMeta = getMetadata('nav');
const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
const fragment = await loadFragment(navPath);
```

**Pattern**: Metadata-driven content loading

### C. Image Optimization Pattern

**Location**: blocks/cards/cards.js:18 + aem.js:299-336

```javascript
const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
```

Creates optimized image URLs with query parameters:
```
/image.jpg?width=750&format=webply&optimize=medium
```

**This demonstrates parameter-based URL construction for dynamic behavior**

---

## 5. REAL-WORLD IMPLEMENTATION: USER FILTERING BLOCK

### Use Case: Display filtered list of users with username contains "wu"

### Approach 1: JSON Data File (Recommended)

**Step 1: Store data in AEM DAM**
File: `/content/dam/demo-site/dummy-data/users.json`
```json
{
  "data": [
    {
      "id": "1",
      "username": "john-wu",
      "name": "John Wu",
      "title": "Software Engineer",
      "image": "/content/dam/avatar-john.png"
    },
    {
      "id": "2", 
      "username": "mary-smith",
      "name": "Mary Smith",
      "title": "Product Manager",
      "image": "/content/dam/avatar-mary.png"
    },
    {
      "id": "3",
      "username": "wu-chan",
      "name": "Wu Chan",
      "title": "Designer",
      "image": "/content/dam/avatar-wu.png"
    }
  ]
}
```

**Step 2: Create users block** (blocks/users/users.js)
```javascript
import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  // Get filter from block content or attributes
  const filterValue = block.getAttribute('data-filter') || 
                      block.querySelector('[data-filter]')?.textContent.trim().toLowerCase();

  // Fetch JSON data
  const response = await fetch('/content/dam/demo-site/dummy-data/users.json');
  const userData = await response.json();

  // Filter users by username
  let users = userData.data;
  if (filterValue) {
    users = users.filter(user => 
      user.username.toLowerCase().includes(filterValue)
    );
  }

  // Render filtered users
  const container = document.createElement('div');
  container.className = 'users-container';

  users.forEach(user => {
    const userCard = document.createElement('div');
    userCard.className = 'user-card';

    // Create image
    const pic = createOptimizedPicture(
      user.image, 
      user.name,
      false,
      [{ width: '200' }]
    );
    
    // Create info
    const info = document.createElement('div');
    info.className = 'user-info';
    info.innerHTML = `
      <h3 class="user-name">${user.name}</h3>
      <p class="user-username">@${user.username}</p>
      <p class="user-title">${user.title}</p>
    `;

    userCard.appendChild(pic);
    userCard.appendChild(info);
    container.appendChild(userCard);
  });

  block.textContent = '';
  block.appendChild(container);
}
```

**Step 3: Update paths.json** (already done - includes dummy-data)

**Step 4: Use in Universal Editor**
In block content area, add data-filter attribute:
```
Filter: wu
```

### Approach 2: Fragment-based Filtering

**Step 1: Create user list page** at `/users-list`  
Contains structured user cards with username data attributes

**Step 2: Fragment with filtering** (custom-fragment block)
```javascript
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const listPath = block.getAttribute('data-path') || '/users-list';
  const filterValue = block.getAttribute('data-filter')?.toLowerCase();

  const fragment = await loadFragment(listPath);
  
  if (fragment && filterValue) {
    // Filter user cards by username
    const cards = fragment.querySelectorAll('[data-username]');
    cards.forEach(card => {
      const username = card.getAttribute('data-username').toLowerCase();
      if (!username.includes(filterValue)) {
        card.style.display = 'none';
      }
    });
  }

  block.append(fragment);
}
```

### Approach 3: Query Index Filtering

**Modify helix-query.yaml** to include custom properties:
```yaml
indices:
  users:
    include: ['/users/**']
    exclude: []
    target: /users-query-index.json
    properties:
      username:
        select: 'h1' # or custom selector
        value: attribute(el, 'data-username')
      title:
        select: '[data-title]'
        value: attribute(el, 'data-title')
```

**Block implementation**:
```javascript
export default async function decorate(block) {
  const filterValue = block.getAttribute('data-filter')?.toLowerCase();

  // Fetch query index
  const response = await fetch('/users-query-index.json');
  const index = await response.json();

  // Filter users
  let users = index.data;
  if (filterValue) {
    users = users.filter(user => 
      user.username?.toLowerCase().includes(filterValue)
    );
  }

  // Render users
  users.forEach(user => {
    // ... render user
  });
}
```

---

## 6. IMPLEMENTATION BEST PRACTICES

### A. Caching Strategies

#### Client-side Caching
```javascript
// Simple cache
const userCache = new Map();

export default async function decorate(block) {
  const cacheKey = 'users-data';
  
  let users = userCache.get(cacheKey);
  if (!users) {
    const response = await fetch('/content/dam/demo-site/dummy-data/users.json');
    users = await response.json();
    userCache.set(cacheKey, users);
  }

  // ... use users
}
```

#### Service Worker Caching (for offline support)
```javascript
// In service worker
addEventListener('fetch', (event) => {
  if (event.request.url.endsWith('.json')) {
    event.respondWith(
      caches.open('json-v1').then((cache) => {
        return cache.match(event.request).then((response) => {
          return response || fetch(event.request).then((response) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});
```

### B. Performance Optimization

#### Lazy Loading Data
```javascript
const observer = new IntersectionObserver(async (entries) => {
  entries.forEach(async (entry) => {
    if (entry.isIntersecting) {
      const block = entry.target;
      const users = await fetchUsers();
      renderUsers(block, users);
      observer.unobserve(block);
    }
  });
});

observer.observe(block);
```

#### Pagination for Large Datasets
```javascript
async function fetchUserPage(page = 0, pageSize = 20) {
  const response = await fetch('/content/dam/demo-site/dummy-data/users.json');
  const data = await response.json();
  
  const start = page * pageSize;
  const end = start + pageSize;
  
  return {
    users: data.data.slice(start, end),
    total: data.data.length,
    page,
    pageSize
  };
}
```

### C. Error Handling

```javascript
export default async function decorate(block) {
  try {
    const response = await fetch('/content/dam/demo-site/dummy-data/users.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    // ... process data
    
  } catch (error) {
    console.error('Failed to load users:', error);
    block.innerHTML = '<p>Failed to load user data. Please try again later.</p>';
  }
}
```

---

## 7. COMPARING APPROACHES

| Approach | Complexity | Flexibility | Performance | Cacheability |
|----------|-----------|-------------|-------------|-------------|
| **JSON Files** | Low | Medium | Excellent | Excellent (CDN) |
| **Fragment Blocks** | Medium | High | Good | Good |
| **Query Index** | Medium | Medium | Good | Excellent |
| **Custom API** | High | Highest | Medium | Medium |

---

## 8. LIMITATIONS AND CONSTRAINTS

### Current Limitations

1. **No Server-side Filtering**
   - All filtering must happen in browser JavaScript
   - Large datasets need pagination client-side

2. **No Authentication per Record**
   - All data must be public or in Git
   - No user-specific data filtering

3. **No Real-time Updates**
   - Data changes require republish
   - Use webhooks for AEM content sync

4. **No GraphQL**
   - Can't query specific fields
   - Must fetch entire JSON files

5. **File Size Limits**
   - Large JSON files impact performance
   - Break into multiple files if > 1MB

### Workarounds

1. **Small Datasets** - Use JSON files with client-side filtering
2. **Large Datasets** - Use Query Index + pagination
3. **Complex Queries** - Create pre-filtered JSON files (computed at build time)
4. **Real-time Data** - Use custom API endpoints (outside Franklin)
5. **Structured Queries** - Use Content Fragments with Fragment API

---

## 9. RECOMMENDED ARCHITECTURE FOR USER FILTERING

```
┌─────────────────────────────────┐
│    AEM DAM/CRX                  │
│  /content/dam/demo-site/        │
│  └── dummy-data/                │
│      └── users.json             │
└─────────────────────────────────┘
           ↓ (Franklin Delivery)
┌─────────────────────────────────┐
│    GitHub CDN (Edge)            │
│  /content/dam/demo-site/        │
│  dummy-data/users.json          │
└─────────────────────────────────┘
           ↓ (Browser fetch)
┌─────────────────────────────────┐
│    JavaScript Block             │
│  (blocks/users/users.js)        │
│                                 │
│  1. fetch('/users.json')        │
│  2. Filter: username contains   │
│  3. Render filtered results     │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│    Browser DOM                  │
│  Filtered user cards displayed  │
└─────────────────────────────────┘
```

---

## 10. FILE STRUCTURE FOR IMPLEMENTATION

```
/blocks/users/
├── users.js              # Block decoration with filtering
├── users.css             # User card styles
├── _users.json          # Block model for Universal Editor
└── README.md            # Documentation

/content/dam/demo-site/dummy-data/
├── users.json           # User data
├── products.json        # Product data
└── rt5760_series.json   # Already mapped to config
```

---

## 11. UNIVERSAL EDITOR INTEGRATION

### Block Model (_users.json)

```json
{
  "definitions": [{
    "title": "Users List",
    "id": "users",
    "plugins": {
      "xwalk": {
        "page": {
          "resourceType": "core/franklin/components/block/v1/block",
          "template": {
            "name": "Users",
            "model": "users",
            "filterValue": "",
            "dataSource": "/content/dam/demo-site/dummy-data/users.json"
          }
        }
      }
    }
  }],
  "models": [{
    "id": "users",
    "fields": [
      {
        "component": "text",
        "name": "filterValue",
        "label": "Filter by Username",
        "placeholder": "e.g., 'wu'"
      },
      {
        "component": "reference",
        "name": "dataSource",
        "label": "Data Source JSON",
        "required": true
      }
    ]
  }]
}
```

---

## 12. KEY TAKEAWAYS

### What Works Now
✓ JSON files in DAM fetched via fetch API  
✓ Fragment-based content composition  
✓ Client-side filtering with JavaScript  
✓ Query index for metadata extraction  
✓ Image optimization parameters  
✓ Universal Editor integration with data attributes  

### What Requires Custom Work
✗ Server-side query APIs  
✗ GraphQL endpoints  
✗ Real-time data sync (needs webhooks)  
✗ User authentication per record  
✗ Database-like queries  

### Recommended for User Filtering Use Case
1. Store users data in JSON file: `/content/dam/demo-site/dummy-data/users.json`
2. Create block: `blocks/users/users.js`
3. Fetch and filter client-side by username
4. Cache results for performance
5. Leverage moveInstrumentation() for editor support

---

## 13. RESOURCES AND REFERENCES

### AEM Official Documentation
- aem.live/developer/block-collection/fragment - Fragment block reference
- experienceleague.adobe.com - AEM Cloud Service docs
- github.com/adobe/aem-boilerplate - Official boilerplate

### Key Functions in Code

| Function | File | Purpose |
|----------|------|---------|
| `loadFragment()` | blocks/fragment/fragment.js | Load and parse external content |
| `createOptimizedPicture()` | scripts/aem.js:299 | Generate optimized image URLs |
| `readBlockConfig()` | scripts/aem.js:195 | Extract key-value config from block |
| `moveInstrumentation()` | scripts/scripts.js:39 | Preserve editor attributes |
| `decorateBlock()` | scripts/aem.js:589 | Apply block-specific decoration |

---

## CONCLUSION

Franklin blocks can implement dynamic data querying and filtering through:

1. **Data Storage**: JSON files in AEM DAM mapped via paths.json
2. **Delivery**: Fetched via standard HTTP GET to `/content/dam/...` endpoints
3. **Filtering**: JavaScript client-side filtering in block decoration functions
4. **Caching**: CDN caching at Edge Delivery layer
5. **Editor Integration**: Universal Editor support via xwalk models and moveInstrumentation()

The implementation pattern is **simple but powerful** - combine JSON data storage with client-side filtering and Edge Delivery caching for optimal performance and developer experience.
