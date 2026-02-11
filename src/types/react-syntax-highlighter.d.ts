declare module "react-syntax-highlighter" {
  import { FC } from "react";
  type Props = { language?: string; style?: any; children?: string; wrapLongLines?: boolean; [k: string]: any };
  export const Prism: FC<Props>;
  const _default: any;
  export default _default;
}

declare module "react-syntax-highlighter/dist/esm/styles/prism" {
  export const atomDark: any;
  export const prism: any;
}