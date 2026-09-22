import React from "react";

/**
 * Card
 *
 * Base container component used throughout the Phishing Trap AI portal
 * to give a consistent look (white background, rounded corners, subtle
 * border, light shadow, responsive padding). Screens can pass additional
 * classes via `className` to customize layout without duplicating or
 * overriding the base styling.
 *
 * Props:
 * - children: Content rendered inside the card.
 * - className (string, optional): Additional classes merged onto the card,
 *     e.g. "flex flex-col gap-4" or "max-w-md mx-auto".
 */
const Card = ({ children, className = "", ...rest }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
