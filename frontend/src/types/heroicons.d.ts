// Type declaration to fix React type compatibility between heroicons and project React types
import * as React from 'react';

declare module '@heroicons/react/24/outline' {
  import { ForwardRefExoticComponent, RefAttributes } from 'react';
  import { SVGProps } from 'react';
  
  export interface HeroIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
    title?: string;
    titleId?: string;
  }
  
  export const PaperAirplaneIcon: ForwardRefExoticComponent<
    HeroIconProps & RefAttributes<SVGSVGElement>
  >;

  // Add other icons as needed
}
