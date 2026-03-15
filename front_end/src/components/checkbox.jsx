import { forwardRef } from "react";

const Checkbox = forwardRef(function Checkbox({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${className || ""}`}
      {...props}
    />
  );
});

const CheckboxField = ({ children, ...props }) => {
  return <div className="flex items-center">{children}</div>;
};

export { Checkbox, CheckboxField };
