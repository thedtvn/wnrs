/// <reference types="vite/client" />

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string }
  export default classes
}
