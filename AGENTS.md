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
- Persist owner machine ordering through a session-checked server function and a service-role-only atomic RPC with stale-order detection; update only product sort so stock and prize content remain untouched.
- Calculate shipping from stored item-price subtotal for both random draws and complete sets, so the same threshold applies to both.
- Export myShip rows in the official ten-column layout; file generation does not create a shipment or provide platform verification macros.
- Use dedicated public content routes for sets, vault and orders, sharing the storefront shell rather than another routing framework.
- Use TanStack navigation for all storefront destinations so the URL, back button, and page metadata stay in sync.
- Award last-one gifts inside the locked stock transaction, once per machine including set purchases; never reset the award on machine edits or expired reservations.
- Persist only anonymous product summaries in draw events; public activity reads use the publishable client and never expose device or shipping identifiers.
- Render share cards from actual result items in browser-safe boutique components, with on-demand image generation and a download fallback.
- Keep optional synthesized gacha audio gesture-initialized and local to the browser; activity thumbnails match current public product summaries without adding customer data.
- Share gacha phase timing between the browser animation controller and audio scheduling; cancel pending cues on skip, mute, failure and dismissal to prevent overlapping effects.
- Use the shared Radix result dialog for dismissal and focus trapping; display scarcity from actual remaining stock, not invented percentage baselines.
- Keep member coupons account-owned with read-only owner RLS; issue rewards and consume one coupon within service-role-only locked RPCs after validating the member session. Store discount snapshots in orders and keep shipping based on pre-discount stored item prices.
- Keep storefront browsing public and member state in one root session context; do not migrate device-owned vaults or orders implicitly when introducing member rewards.
- Store member contact fields in owner-scoped profiles through authenticated server functions; derive Email from verified auth, never use phone as an identity credential, and preserve edited checkout fields when prefilling.
- Reserve new draws and sets in a server-derived member vault through a verified session; attach pending collectibles in the same locked RPC and credit them only on first checkout through a transactional trigger. Expiry deletes pending cards with their vault rows. Existing guest vaults are not implicitly migrated.
- Restore member presentation on initial and refreshed sessions without cache refetches; identity transitions alone invalidate routes and queries, while server writes revalidate the user.
- Keep collectible numbering stable and resolve each card to its own bundled illustration; catalog changes must preserve existing owned card numbers.
- Keep first-visit guidance browser-safe and checkout acknowledgements local to presentation; never replace authoritative stock, price or shipping validation with UI checks.
- Group repeated vault prizes only in browser presentation using prize identity and stored snapshots; retain individual reservations for totals, expiry and checkout.
- Snapshot fulfillment on vault insertion inside the stock transaction and persist checkout's latest preorder date in orders; machine edits must not silently rewrite existing purchase schedules.
- Keep preorder consent validated against the locked vault schedule in checkout RPC; display acknowledgements cannot replace authoritative transaction validation.
