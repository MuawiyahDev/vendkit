/**
 * Interaction styles for controls sitting on the dark sidebar surface.
 * Ghost buttons inherit light-surface hover/focus tokens, so sidebar controls
 * override them with the sidebar accent and focus ring.
 */
export const SIDEBAR_CONTROL_INTERACTION =
  "transition-colors duration-150 ease-out motion-reduce:transition-none hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-sidebar-ring/70 active:bg-sidebar-accent";

/**
 * Row padding shared by every sidebar control. The `has-[>svg]` value
 * cancels the default Button padding for direct icon children so all icons
 * line up with the navigation icons.
 */
export const SIDEBAR_ROW_PADDING = "px-2 has-[>svg]:px-2";

/** DOM id of the desktop sidebar, referenced by its collapse control. */
export const SIDEBAR_ELEMENT_ID = "app-sidebar";
