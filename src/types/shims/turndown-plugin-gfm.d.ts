declare module 'turndown-plugin-gfm' {
  import type TurndownService from 'turndown';
  type Plugin = (service: TurndownService) => void;
  export const gfm: Plugin;
  export const tables: Plugin;
  const _default: { gfm: Plugin; tables: Plugin };
  export default _default;
}