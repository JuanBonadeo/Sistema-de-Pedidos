export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const actionOk = <T>(data: T): ActionResult<T> => ({ ok: true, data });

export const actionError = (error: string): ActionResult<never> => ({
  ok: false,
  error,
});
