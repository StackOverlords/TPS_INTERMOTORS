export interface DialogField {
  name: string;
  label: string;
  placeholder: string;
  type?: "text" | "number";
  required?: boolean;
}

export interface DialogConfig {
  title: string;
  description: string;
  field: DialogField;
  screen_path?: string;
}
