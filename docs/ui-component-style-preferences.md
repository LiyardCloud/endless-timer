# UI Component Style Preferences

Use this note when designing compact control panels like Timeline headers, filter bars, range selectors, and small page-level tool surfaces.

## Compact Glass Control Panels

Preferred direction:

- Keep the component compact and structurally flat.
- Use a single glass-like surface, not nested cards.
- Prefer `rounded-[21px]` to `rounded-[22px]` for the inner panel and `rounded-[22px]` for a 1px outer treatment.
- Use muted borders: `border-white/[0.08]` for the panel, `border-white/[0.08]` for inputs, and about `border-white/[0.055]` to `border-white/[0.07]` for small icon controls.
- Avoid bright white borders. They should read as subtle structure, not outlines.
- Use `bg-white/[0.06]` or similar for the glass panel and `backdrop-blur-xl`.
- Use a dark input/control fill like `bg-black/20`; matching fills across date fields and arrow buttons makes the control group feel intentional.
- Keep hover states quiet: `hover:bg-black/30` or another small contrast shift.

## Layout Pattern

For Timeline-like headers:

- Left side: eyebrow label, primary heading, and secondary date/range text.
- Right side: direct input first, then navigation or action icon buttons.
- Date input should come before previous/next arrows when the arrows are supplemental navigation.
- Group related icon buttons inside a low-contrast rounded container.
- Keep controls at `h-9` or `size-8` where possible.
- Use icons rather than text for repeated mechanical controls like previous/next.

## Typography

- Eyebrow: uppercase, small, muted, tracked text.
- Heading: compact but readable, around `text-lg`.
- Secondary date/range: `text-xs` and muted, such as `text-white/55`.
- Do not include instructional copy inside compact panels unless it is needed for clarity.

## Background Treatment

Acceptable subtle background treatment:

```tsx
<div className="rounded-[22px] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.045)_0px,rgba(255,255,255,0.045)_1px,transparent_1px,transparent_9px),linear-gradient(135deg,rgba(38,92,255,0.26),rgba(7,9,16,0.9))] p-px">
  <section className="rounded-[21px] border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 shadow-panel backdrop-blur-xl">
    {/* content */}
  </section>
</div>
```

Use this texture sparingly. It works best on page-level control panels, not every list row or repeated item.

## Example Control Group

```tsx
<div className="flex min-w-0 items-center gap-2">
  <label className="flex h-9 min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 text-sm text-white sm:w-[170px]">
    <Calendar size={15} className="shrink-0 text-white/75" />
    <input className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]" type="date" />
  </label>
  <div className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-black/18 p-1">
    <Button variant="outline" size="icon" className="size-8 border-white/[0.055] bg-black/20 hover:border-white/[0.09] hover:bg-black/30">
      <ArrowLeft size={14} />
    </Button>
    <Button variant="outline" size="icon" className="size-8 border-white/[0.055] bg-black/20 hover:border-white/[0.09] hover:bg-black/30">
      <ArrowRight size={14} />
    </Button>
  </div>
</div>
```

