import { forwardRef } from "react";

const Strong = forwardRef(function Strong({ className, ...props }, ref) {
  return (
    <strong
      ref={ref}
      className={`font-semibold ${className || ""}`}
      {...props}
    />
  );
});

export { Strong };
