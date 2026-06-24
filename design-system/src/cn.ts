/** class 名を合成する小さなヘルパ。false/null/undefined は除去。
 *  ユーザー指定の className は常に最後に積む（上書きを許す）。 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
