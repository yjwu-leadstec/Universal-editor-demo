export const MOBILE_MEDIA_QUERY = '(max-width: 719px)';

export function resolveResponsiveDefault(desktopValue, mobileValue, isMobile) {
  if (isMobile && mobileValue) return mobileValue;
  return desktopValue;
}
