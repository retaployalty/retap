declare module 'country-list' {
  export function countries(): { [key: string]: string };
  export function names(): { [key: string]: string };
  export function codes(): string[];
  export function getCode(name: string): string | undefined;
  export function getName(code: string): string | undefined;
} 