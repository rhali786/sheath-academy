export const APP_HEADER_HEIGHT_VAR = '--app-header-height'

export function setAppHeaderHeight(px: number): void {
  document.documentElement.style.setProperty(APP_HEADER_HEIGHT_VAR, `${px}px`)
}

export function clearAppHeaderHeight(): void {
  document.documentElement.style.removeProperty(APP_HEADER_HEIGHT_VAR)
}

export function getAppHeaderHeight(): string {
  return document.documentElement.style.getPropertyValue(APP_HEADER_HEIGHT_VAR)
}
