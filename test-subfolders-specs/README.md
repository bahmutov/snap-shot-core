# test-subfolders-specs

This repo shows how `snap-shot-core` stores all snapshots from nested specs in subfolders that are parallel to the original specs

```
specs/
  spec.js
  subfolder/
    spec2.js
```

result should be

```
__snapshots__/
  specs/
    spec.js.snapshot.js
    subfolder/
      spec2.js.snapshot.js
```
