import { EditableField, type EditableFieldProps } from "@/components/common/EditableField";

export const EditablePercentage: React.FC<Omit<EditableFieldProps, 'type' | 'formatter' | 'suffix'>> = (props) => (
    <EditableField
        {...props}
        type="number"
        formatter={(value) => typeof value === 'number' ? value.toFixed(2) : parseFloat(value.toString()).toFixed(2)}
        numberProps={{ min: 0, max: 100, step: 0.1, ...props.numberProps }}
        focusNextOnEnter={true}
    />
);