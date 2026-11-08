<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep storefront presentation in small browser-safe boutique components; retain server functions as the only write boundary.
- Calculate shipping from stored item-price subtotal for both random draws and complete sets, so the same threshold applies to both.
- Export myShip rows in the official ten-column layout; file generation does not create a shipment or provide platform verification macros.
- Use dedicated public content routes for sets, vault and orders, sharing the storefront shell rather than another routing framework.
- Use TanStack navigation for all storefront destinations so the URL, back button, and page metadata stay in sync.
- Award last-one gifts inside the locked stock transaction, once per machine including set purchases; never reset the award on machine edits or expired reservations.
- Persist only anonymous product summaries in draw events; public activity reads use the publishable client and never expose device or shipping identifiers.
- Render share cards from actual result items in browser-safe boutique components, with on-demand image generation and a download fallback.
