# Wiremap — How the project fits together

A map of how every file in this project connects, from test data through to the live KlipBoard site. GitHub renders the diagrams below automatically.

## 1. Overall architecture

Every spec in `tests/` is built the same way: data flows up from `test-data/`, through `pages/` and `fixture/`, into the spec. `playwright.config.ts` and `tsconfig.json` are cross-cutting — they configure/enable everything below them rather than being imported directly.

```mermaid
flowchart TD
    subgraph CFG["⚙️ Configuration"]
        PWCONFIG["playwright.config.ts\nbaseURL · browsers · reporters"]
        TSCONFIG["tsconfig.json\nenables importing .json files"]
    end

    subgraph DATA["📄 test-data/"]
        HOMEJSON["home.json\nurl, title, heading"]
        APIJSON["api-endpoints.json\npath, expectedStatus, ..."]
    end

    subgraph PAGES["🧩 pages/"]
        BASEPAGE["base-page.ts\nBasePage"]
        HOMEPAGE["klipboard-homepage.ts\nKlipboardHomepage"]
        BASEPAGE --> HOMEPAGE
    end

    subgraph UTIL["🛠️ utility/"]
        A11Y["accessibility.ts\ngenerateAccessibilityReport"]
    end

    subgraph FIX["🔌 fixture/"]
        FIXTURE["test-options.ts\ntest, expect, homepage fixture"]
    end

    HOMEJSON --> FIXTURE
    HOMEPAGE --> FIXTURE

    subgraph TESTS["✅ tests/"]
        HOMETEST["home.spec.ts"]
        A11YTEST["accessibility.spec.ts"]
        APITEST["api.spec.ts"]
    end

    FIXTURE --> HOMETEST
    FIXTURE --> A11YTEST
    FIXTURE --> APITEST

    HOMEJSON -.->|data row| HOMETEST
    HOMEJSON -.->|data row| A11YTEST
    HOMEJSON -.->|data row| APITEST
    APIJSON -.->|data rows| APITEST
    A11Y --> A11YTEST

    PWCONFIG -.->|configures| TESTS
    TSCONFIG -.->|enables JSON import| DATA

    HOMETEST -->|renders in a real browser| SITE["🌐 Live KlipBoard site"]
    A11YTEST -->|renders + axe scan| SITE
    APITEST -->|see diagram 2 below| SITE

    classDef cfg fill:#eef,stroke:#88a
    classDef data fill:#fef6d8,stroke:#d4b106
    classDef page fill:#e6f4ff,stroke:#1677ff
    classDef fix fill:#fff1e6,stroke:#fa8c16
    classDef util fill:#e6fffb,stroke:#13a8a8
    classDef test fill:#f0f9e8,stroke:#52c41a
    classDef site fill:#fff0f0,stroke:#f5222d

    class PWCONFIG,TSCONFIG cfg
    class HOMEJSON,APIJSON data
    class BASEPAGE,HOMEPAGE page
    class FIXTURE fix
    class A11Y util
    class HOMETEST,A11YTEST,APITEST test
    class SITE site
```

## 2. `api.spec.ts` is different — it has two separate paths

Every other spec only ever talks to the real site through a rendered browser page. `api.spec.ts` does that **too**, but it also talks to the site directly over raw HTTP with no browser involved — and reuses that same browser path specifically to simulate failures the live site would never reliably produce on demand. These are two genuinely different techniques living in one file:

```mermaid
flowchart LR
    subgraph PathA["① Happy-path & performance checks — real HTTP, no browser"]
        direction TB
        A1["api-endpoints.json\n+ home.json (url only)"] --> A2["request fixture\n(APIRequestContext)"]
        A2 -->|"GET /, /robots.txt,\n/sitemap.xml"| A3["🌐 Live KlipBoard site"]
        A3 --> A4["assert: status code,\ncontent-type, body text,\nresponse time"]
    end

    subgraph PathB["② Resilience checks — through a browser page, intercepted"]
        direction TB
        B1["home.json\n(url + heading)"] --> B2["homepage fixture\n(KlipboardHomepage)"]
        B2 --> B3["page.route()\nintercepts the request\nbefore it's answered"]
        B3 -->|slow| B4a["⏱️ delayed, then\nreal response"]
        B3 -->|dropped| B4b["🎭 connection aborted\n— site never reached"]
        B3 -->|server error| B4c["🎭 fake 500 response\n— site never reached"]
        B3 -->|wrong content| B4d["🎭 fake HTML returned\n— site never reached"]
        B4a --> B5["assert: heading still\nappears, or the\nfailure is detected"]
        B4b --> B5
        B4c --> B5
        B4d --> B5
    end

    classDef real fill:#f0f9e8,stroke:#52c41a
    classDef sim fill:#fff0f0,stroke:#f5222d

    class A3,B4a real
    class B4b,B4c,B4d sim
```

**The difference in one sentence:** path ① asks "is the real site actually behaving correctly right now?"; path ② asks "if the site ever misbehaves, would our tests actually notice?" — three of its four scenarios never contact the real site at all, they test the test suite's own detection.
