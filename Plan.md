# rubik

## Core

- [ ] voxel data structure
- [ ] voxel update, serialize, deserialize
- [ ] voxel face & body alias

## Render

- [ ] basic render
- [ ] display effects
- [ ] grid and indicators

## Operations

- [ ] set
- [ ] move
- [ ] copy

> example
>
>```bash
>  set block|bface|cface|brect|bbody|cbody|space '[1,2,3]' --enabled true --rgba '#1e1e1fff'
>  mv block|bface|cface|brect|bbody|cbody '[1,git s2,3]' --distance '[1,0,0]' --to '[2,3,4]' --mirror x --force --trace --override
>  copy block|bface|cface|brect|bbody|cbody '[1,2,3]' --distance '[5,0,0]' --to '[2,3,4]' --to '[2,3,5]' --mirror xyz --override --force
>```

## Api & Cli

- [ ] rpc & cli
- [ ] operation interpretor
- [ ] operation history
- [ ] undo and redo
- [ ] operations
  - [ ] set
  - [ ] mv
  - [ ] copy
