import { EditableField, type EditableFieldProps } from "@/components/common/EditableField";

export const EditablePrice: React.FC<Omit<EditableFieldProps, 'type' | 'formatter' | 'prefix'>> = (props) => (
    <EditableField
        {...props}
        type="number"
        formatter={(value) => typeof value === 'number' ? value.toFixed(2) : parseFloat(value.toString()).toFixed(2)}
        numberProps={{ min: 0, step: 0.01, ...props.numberProps }}
        focusNextOnEnter={true}
    />
);