# Design System Strategy: The Culinary Editorial

## 1. Overview & Creative North Star: "The Kinetic Curator"
The objective of this design system is to move beyond the utility of a standard delivery app and into the realm of a high-end concierge. Our Creative North Star is **"The Kinetic Curator."** 

While typical delivery apps feel like spreadsheets of food, this system treats the interface as a living editorial. We achieve "Zero Friction" not through simplicity alone, but through **intentional hierarchy**. By utilizing Inter as a high-contrast typographic tool and replacing rigid borders with tonal layering, we create a layout that feels fluid and premium. The "Kinetic" aspect comes from the use of depth—elements don't just sit on a screen; they exist in a physical space defined by light and surface.

---

## 2. Colors: Tonal Architecture
We move away from "flat" design by using a sophisticated palette of neutral grays and a high-energy primary accent. 

### Palette Definition
*   **Primary (`#b80035`):** The engine of the UI. Used exclusively for "Commitment Actions" (Add to Cart, Place Order).
*   **Surface Hierarchy:** We utilize a 5-tier surface system to define importance without using lines.
    *   `surface_container_lowest`: Pure white (`#ffffff`) for cards containing primary data.
    *   `surface`: The base canvas (`#faf8ff`).
    *   `surface_container_low`: Backgrounds for secondary sections.
    *   `surface_container_highest`: For persistent elements like sticky navigation bars.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content.
*   **Correction:** To separate a "Recommended" section from a "Main Menu," shift the background from `surface` to `surface_container_low`. 
*   **The Goal:** Use space and color-blocking to guide the eye. Lines create visual noise; tonal shifts create focus.

### The "Glass & Tone" Rule
To elevate the "flat" requirement into something premium, use **Glassmorphism** for floating action buttons or sticky headers. 
*   Use `surface_container_highest` at 80% opacity with a `20px` backdrop-blur. This allows the vibrant food photography to bleed through the UI, making the app feel immersive.

---

## 3. Typography: The Editorial Voice
We use **Inter** not just for readability, but as a brand signifier through extreme weight contrast.

*   **Display & Headline:** Use `headline-lg` (2rem) with `font-weight: 800` for restaurant names. The tight tracking and heavy weight create an authoritative, "editorial" look.
*   **Titles:** `title-lg` (1.375rem) is the workhorse for category headers.
*   **The Functional Body:** `body-md` (0.875rem) handles the heavy lifting of descriptions. Maintain a line-height of 1.5 to ensure "Zero Friction" readability during quick scrolling.
*   **Micro-Data:** Use `label-sm` (0.6875rem) in `all-caps` with `letter-spacing: 0.05em` for secondary metadata like "20-30 MIN" or "DELIVERY FEE."

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are heavy; we use **Ambient Light** and **Tonal Stacking**.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface_container_lowest` card should sit atop a `surface_container_low` background. The subtle 2% difference in lightness is enough for the human eye to perceive a physical lift.
*   **Ambient Shadows:** For floating "Checkout" bars, use a shadow with a blur of `32px`, an Y-offset of `8px`, and an opacity of `4%`. Use the `on_surface` color (`#131b2e`) for the shadow tint to keep it natural.
*   **The Ghost Border:** If a form input requires a boundary for accessibility, use the `outline_variant` token at 15% opacity. It should be felt, not seen.

---

## 5. Components: The Signature Kit

### Buttons (The Conversion Drivers)
*   **Primary:** Background `primary` (`#b80035`), Text `on_primary` (`#ffffff`). Height: `56px` for mobile. Radius: `md` (0.75rem).
*   **Secondary:** Background `surface_container_highest`, Text `primary`. No border.
*   **State:** On `active`, scale the button to `0.98` to provide haptic-like visual feedback.

### Cards & Lists (The Content Feed)
*   **Rule:** Forbid divider lines between list items.
*   **Implementation:** Use `16px` of vertical white space and a subtle background shift on hover/tap.
*   **Skeleton Loaders:** Use a pulse animation transitioning from `surface_container_low` to `surface_container_high`. Avoid grey-to-white; stay within the tonal family.

### Inputs & Selection
*   **Large Tap Targets:** All interactive elements (Checkboxes, Radio buttons) must occupy a minimum hit area of `44px x 44px`.
*   **Status Badges:** Use `tertiary_container` for "Healthy" or "Top Rated" tags—the green tones provide a fresh, organic contrast to the red primary.

### Sticky Action Bar (The Closer)
The sticky bar at the bottom of the screen should use a `surface_container_highest` glass effect. This keeps the "Total Price" and "View Cart" action ever-present but visually light.

---

## 6. Do’s and Don'ts

### Do
*   **Do** use extreme vertical whitespace (32px+) between major sections to reduce cognitive load.
*   **Do** use `surface_tint` sparingly to highlight active navigation states.
*   **Do** prioritize high-quality photography; the UI is the frame, the food is the art.

### Don't
*   **Don't** use 100% black text. Use `on_surface` (`#131b2e`) to keep the "High-End" softened feel.
*   **Don't** use sharp 0px corners. Even a "flat" look requires the `DEFAULT` (0.5rem) radius to feel modern and approachable.
*   **Don't** use generic "drop shadows." If it looks like a 2010 Photoshop preset, it’s too heavy. Use tonal layering instead.