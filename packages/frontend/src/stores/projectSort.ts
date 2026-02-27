import type { Project } from "@backend/public";

const NAME_COLLATOR = new Intl.Collator(["en", "zh-Hant"], {
  numeric: true,
  sensitivity: "base",
});

function normalizeCode(code: string) {
  return code.trim();
}

function getNameBucket(name: string) {
  const firstChar = name.trim().charAt(0);
  if (!firstChar) {
    return 2;
  }
  if (/[A-Za-z]/.test(firstChar)) {
    return 0;
  }
  if (/[\u3400-\u9FFF]/.test(firstChar)) {
    return 1;
  }
  return 2;
}

export function compareNameEnThenZh(aName: string, bName: string) {
  const aBucket = getNameBucket(aName);
  const bBucket = getNameBucket(bName);
  if (aBucket !== bBucket) {
    return aBucket - bBucket;
  }
  return NAME_COLLATOR.compare(aName, bName);
}

export function compareProjectByOrderCodeName(a: Project, b: Project) {
  const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) {
    return aOrder - bOrder;
  }

  const aCode = normalizeCode(a.code);
  const bCode = normalizeCode(b.code);
  const aHasCode = aCode.length > 0;
  const bHasCode = bCode.length > 0;
  if (aHasCode !== bHasCode) {
    return aHasCode ? -1 : 1;
  }
  if (aCode !== bCode) {
    return aCode.localeCompare(bCode, "en", { sensitivity: "base" });
  }

  return compareNameEnThenZh(a.name, b.name);
}
