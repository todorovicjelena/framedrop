// Return type for Server Actions that can fail with a user-facing (translated) message.
export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };
