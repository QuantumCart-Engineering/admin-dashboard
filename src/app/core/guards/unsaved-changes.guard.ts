import { CanDeactivateFn } from '@angular/router';

/**
 * A component that can report whether it is safe to leave (e.g. an
 * in-progress form with unsaved changes). May resolve asynchronously to
 * allow a confirmation dialog.
 */
export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Promise<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<ComponentCanDeactivate> = (component) => {
  if (!component || typeof component.canDeactivate !== 'function') {
    return true;
  }
  return component.canDeactivate();
};
