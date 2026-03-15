import { forwardRef } from "react";

const Heading = forwardRef(function Heading(
  { level = 1, className, ...props },
  ref,
) {
  const Component = `h${level}`;
  return (
    <Component
      ref={ref}
      className={`text-2xl font-bold text-gray-900 ${className || ""}`}
      {...props}
    />
  );
});

export { Heading };
