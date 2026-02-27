type ShouldBlockMutationRequestArgs = {
  method: string;
  pathname: string;
  isSyncWritable: boolean;
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const GUARDED_BYPASS_SUFFIXES = ["/api/login", "/api/logout"];

export function isMutationMethod(method: string) {
  return !SAFE_METHODS.has(method.toUpperCase());
}

export function shouldBypassSyncGuard(pathname: string) {
  return GUARDED_BYPASS_SUFFIXES.some((suffix) => pathname.endsWith(suffix));
}

export function shouldBlockMutationRequest({
  method,
  pathname,
  isSyncWritable,
}: ShouldBlockMutationRequestArgs) {
  if (!isMutationMethod(method)) {
    return false;
  }
  if (shouldBypassSyncGuard(pathname)) {
    return false;
  }
  return !isSyncWritable;
}
