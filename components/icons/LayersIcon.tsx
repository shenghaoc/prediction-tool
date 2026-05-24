import * as React from "react";

export function LayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M10 2L2 6.5L10 11L18 6.5L10 2Z" fill="currentColor" fillOpacity=".7"/>
      <path d="M2 10.5L10 15L18 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
      <path d="M2 14.5L10 19L18 14.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}
export default LayersIcon;
