import React from 'react';

interface ImportMetaEnv {
  readonly VITE_RESERVAS_BASE_URL?: string;
  readonly VITE_COMPANION_PORTAL_URL?: string;
  readonly VITE_STAFF_PORTAL_URL?: string;
  readonly VITE_REFORESTATION_ALIAS?: string;
  readonly VITE_REFORESTATION_ACCOUNT_HOLDER?: string;
  readonly VITE_REFORESTATION_CBU?: string;
  readonly VITE_REFORESTATION_RAISED_AMOUNT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  namespace JSX {
    type Element = React.JSX.Element;
    type IntrinsicElements = React.JSX.IntrinsicElements;
    type ElementChildrenAttribute = React.JSX.ElementChildrenAttribute;
    type IntrinsicAttributes = React.JSX.IntrinsicAttributes;
    type IntrinsicClassAttributes<T> = React.JSX.IntrinsicClassAttributes<T>;
    type ElementAttributesProperty = React.JSX.ElementAttributesProperty;
    type ElementClass = React.JSX.ElementClass;
    type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<C, P>;
  }
}
