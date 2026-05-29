## 2024-05-18 - Unifying Focus States for Composite Input Components
**Learning:** When dealing with composite inputs containing multiple interactive sub-elements (like an `Input` accompanied by an inline unit label/span), using `focus-within` on the parent container provides a unified and cohesive focus state. Applying focus states directly to inner children often results in conflicting border overlaps or partial highlighting.
**Action:** When designing or refactoring composite form components in Tailwind CSS/Shadcn, apply focus, hover, and shadow states directly to a wrapping container using `focus-within:` classes, and remove default borders and outlines from the nested elements. This ensures visual consistency across the entire component block.

## 2024-05-19 - Making Radix UI Tooltip Triggers Keyboard Accessible
**Learning:** Radix UI `TooltipTrigger` components rely on their children to be natively focusable to trigger tooltips via keyboard navigation. If the `asChild` prop wraps a non-interactive element (like a generic `<div>`), keyboard users cannot access the tooltip content, leading to a critical accessibility failure.
**Action:** Always ensure that elements wrapped by a `TooltipTrigger` are natively focusable. If wrapping a non-interactive element, explicitly add `tabIndex={0}` and apply clear `focus-visible` styles to provide proper keyboard navigation feedback.

## 2024-05-29 - Number Field Screen Reader Unit Association
**Learning:** For composite inputs with an `aria-label` and an adjacent visually hidden unit (e.g., a `.sr-only` span), screen readers will ignore the unit text because `aria-label` overrides the element's content, and the sibling unit isn't directly read out in the focus context.
**Action:** When creating inputs with screen-reader-only unit text, always add an `id` to the unit element and reference it using `aria-describedby` on the input element. This guarantees screen readers announce the full context (e.g., "Floor area, 20, square meters").
