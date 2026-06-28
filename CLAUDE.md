# LuliDigital Website — Claude Project Instructions

## Model Override
Default model: claude-fable-5

## Fiker Avatar Pack

The canonical Anime Fiker expression library is located at:

`public/assets/fiker-avatar-pack/`

Before generating or requesting a new Fiker avatar, read `public/assets/fiker-avatar-pack/README.md` and select the closest existing semantic pose. Use the shared `src/components/FikerAvatar.tsx` component in React/Astro UI:

For avatars placed on blog cards, quote blocks, or section edges, prefer `sitting-perch`, `sitting-crosslegged`, `sitting-laptop`, or `sitting-side` before creating a new sitting illustration.

```tsx
<FikerAvatar pose="thinking" />
```

Do not change the character identity, default curly copper-brown hair, black turtleneck, dark wide-leg jeans, or gold jewelry. Do not overwrite an existing pose with a different expression or outfit. Add a new consistently named transparent PNG only when the pack does not cover the required use case.
