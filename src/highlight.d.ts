declare class Highlight {
  constructor(...ranges: Range[]);
}

type FindNavHighlightRegistry = {
  set(name: string, highlight: Highlight): void;
  delete(name: string): boolean;
};
