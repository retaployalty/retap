# ReTap Web Theme

Questa cartella contiene il tema condiviso per il sito web ReTap, convertito dal tema Flutter.

## Come usare

- Importa i colori, le tipografie e gli stili da `theme.ts` nei tuoi componenti React/Next.js.
- Il font principale è **Fredoka** ([Google Fonts](https://fonts.google.com/specimen/Fredoka)).
- Per usare Fredoka, importa tramite next/font/google oppure aggiungi il link nel tuo `_app.tsx` o `layout.tsx`.

## Esempio di utilizzo

```tsx
import { colors, textStyles, buttonStyles } from "@/theme/theme";

export function ExampleButton() {
  return (
    <button style={buttonStyles.primary}>
      My Button
    </button>
  );
}
```

## Palette colori
- Primary: #FF6565
- Secondary: #FFFFFF
- Tertiary: #1A1A1A
- Success: #28A745
- Background: #FFFFFF
- Surface: #F8F9FA
- Text Primary: #1A1A1A
- Text Secondary: #666666
- Text Disabled: #999999

## Tipografia
- Font: Fredoka, Arial, sans-serif
- Usa le chiavi di `textStyles` per titoli, body, label ecc. 