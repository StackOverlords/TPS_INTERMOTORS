import {
  EditableField,
  type EditableFieldProps,
} from "@/components/common/EditableField";

export const EditableQuantity: React.FC<Omit<EditableFieldProps, "type">> = (
  props
) => (
  <EditableField
    {...props}
    type="number"
    numberProps={{ min: 1, step: 1, ...props.numberProps }}
    formatter={(value) => value.toString()}
    focusNextOnEnter={true}
  />
);
