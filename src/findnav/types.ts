export type ActionKind = "link" | "button" | "field" | "clickable";

export type ActionMatch = {
  type: "action";
  element: HTMLElement;
  label: string;
  kind: ActionKind;
  score: number;
};

export type TextMatch = {
  type: "text";
  range: Range;
  score: number;
};

export type Match = ActionMatch | TextMatch;

export type Overlay = {
  root: HTMLElement;
  input: HTMLInputElement;
  count: HTMLElement;
};
