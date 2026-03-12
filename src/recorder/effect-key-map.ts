let currentTag: { effectKey: string; params: Record<string, any> } | null = null;

export function tagEffect(effectKey: string, params: Record<string, any>) {
  currentTag = { effectKey, params };
}

export function consumeTag(): { effectKey: string; params: Record<string, any> } | null {
  const tag = currentTag;
  currentTag = null;
  return tag;
}
