# test-nested-specs

This repo shows how `snap-shot-core` stores all snapshots from nested specs like

```
spec.js
subfolder/
  spec2.js
```

in a single flat folder

```
__snapshots__/
  spec.js.snapshot.js
  spec2.js.snapshot.js
```
