import { forwardRef } from "react";

const Field = forwardRef(function Field({ className, ...props }, ref) {
  return (
    <div ref={ref} className={`space-y-2 ${className || ""}`} {...props} />
  );
});

const Label = forwardRef(function Label({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={`block text-sm font-medium text-gray-700 ${className || ""}`}
      {...props}
    />
  );
});

export { Field, Label };
