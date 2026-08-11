export {};

/* Ambient typing for the legacy template globals exposed on window.LW
   by the vendored assets/js files (see public/assets/js). Shared here
   so app.ts and the HTTP interceptor don't each redeclare it. */
declare global {
  interface Window {
    LW?: {
      boot?: () => void;
      bootAuth?: () => void;
      bootFeed?: () => void;
      bootJournal?: () => void;
      bootCompose?: () => void;
      bootProfile?: () => void;
      bootWriters?: () => void;
      toast?: (msg: string, bad?: boolean) => void;
      /** Bridge so the vendored compose.js editor's inline "image" toolbar
       *  button can open the Angular upload dialog — see ComposeComponent. */
      openImageUpload?: (callback: (url: string | null) => void) => void;
      /** Bridge the other direction: resets compose.js's own DOM/undo-history
       *  state (title/dek/cover/category/body fields, live preview, toolbar)
       *  after Angular's own confirm() + discard-orphaned-images cleanup —
       *  see ComposeComponent.onClear()/canDeactivate(). Set by
       *  LW.bootCompose(), so it only exists while the compose page is
       *  actually mounted. */
      resetComposeEditor?: () => void;
    };
  }
}
