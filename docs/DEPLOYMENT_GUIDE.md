# Production Deployment & Embed Guide // Cr Vector Sync

## 1. Browser Native & Web Worker Environment
Install via your preferred package manager:
```bash
npm install cr-vector-sync
```

```javascript
import { EngineContext } from 'cr-vector-sync';

const engine = new EngineContext({
  arenaSize: 32 * 1024 * 1024,
  strictMode: true
});

await engine.initialize();
```

## 2. Air-Gapped / Sovereign Deployments
Download the zero-dependency bundle or clone directly. No external registry or network access is required at runtime.
