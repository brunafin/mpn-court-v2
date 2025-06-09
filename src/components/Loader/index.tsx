import React from "react";
import { ClockLoader } from "react-spinners";

interface LoaderProps {
  loading?: boolean;
  size?: number;
  color?: string;
}

const Loader: React.FC<LoaderProps> = ({
  loading = true,
  size = 50,
  color = "var(--color-neutral-200)",
}) => {
  if (!loading) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "var(--color-neutral-800)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <ClockLoader size={size} color={color} />
    </div>
  );
};

export default Loader;
