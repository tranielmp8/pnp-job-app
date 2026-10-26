The official PrideNPurpose theme is the orange-to-red palette, paired with clean white surfaces in light mode and warm near-black
surfaces in dark mode.

Here are the complete reusable CSS tokens, with the selected PNP overrides already merged:

# /_ PrideNPurpose — Light mode _/

:root {
color-scheme: light;

    /* Text */
    --color-text: #17151a;
    --color-text-muted: #625e66;

    /* Brand */
    --color-primary: #c2410c;
    --color-primary-deep: #7c2608;
    --color-accent: #ef4444;
    --color-highlight: #ea580c;
    --color-brand-soft: #fed7aa;

    /* Surfaces */
    --color-background: #ffffff;
    --color-surface: #ffffff;
    --color-cream: #f7f7f8;
    --color-border: #e4e2e6;
    --color-nav: rgba(255, 255, 255, 0.9);

# /_ On dark brand sections _/

    --color-on-dark: #ffffff;
    --color-on-dark-muted: #d5c9e6;

    /* Effects */
    --color-glow: rgba(239, 68, 68, 0.15);
    --color-mark: rgba(194, 65, 12, 0.09);
    --color-process-line: #dedbe1;

    /* Brand gradients */
    --gradient-brand:
      linear-gradient(135deg, #7c2508 0%, #d24d0c 52%, #ef4444 115%);

    --gradient-contact:
      linear-gradient(135deg, #541707 0%, #b7350b 55%, #ef4444 130%);

    --color-footer: #260b05;

}

# /_ PrideNPurpose — Dark mode _/

.dark {
color-scheme: dark;

    /* Text */
    --color-text: #f6f2fc;
    --color-text-muted: #aaa1b7;

    /* Brand */
    --color-primary: #fb923c;
    --color-primary-deep: #7c2d12;
    --color-accent: #ef4444;
    --color-highlight: #f97316;
    --color-brand-soft: #e9b995;

    /* Surfaces */
    --color-background: #050407;
    --color-surface: #100d14;
    --color-cream: #0d0a11;
    --color-border: #292230;
    --color-nav: rgba(5, 4, 7, 0.88);

    /* Content on dark sections */
    --color-on-dark: #faf7ff;
    --color-on-dark-muted: #bdb2ca;

    /* Effects */
    --color-glow: rgba(249, 115, 22, 0.24);
    --color-mark: rgba(251, 146, 60, 0.1);
    --color-process-line: #30263a;

    /* Backgrounds and gradients */
    --gradient-background:
      radial-gradient(
        circle at 82% 8%,
        rgba(124, 45, 18, 0.3),
        transparent 34%
      ),
      linear-gradient(145deg, #050403 0%, #0c0806 52%, #160b07 100%);

    --gradient-brand:
      linear-gradient(135deg, #030202 0%, #251007 48%, #7c2d12 120%);

    --gradient-contact:
      linear-gradient(135deg, #020101 0%, #1d0b05 55%, #8b2518 145%);

    --color-footer: #020103;

}

### The core brand swatches are:

- Burnt orange: #c2410c
- Bright orange: #f97316
- Light orange: #fb923c
- Brand red: #ef4444
- Deep orange: #7c2608
- Soft orange: #fed7aa
- Light background: #ffffff
- Dark background: #050407
- Light-mode text: #17151a
- Dark-mode text: #f6f2fc
