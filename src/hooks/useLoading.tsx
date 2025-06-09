import { useState } from "react";

type AsyncFunction = () => Promise<void>;

export function useLoading() {
  const [loading, setLoading] = useState<boolean>(false);

  async function withLoading(asyncFunc: AsyncFunction): Promise<void> {
    setLoading(true);
    try {
      await asyncFunc();
    } finally {
      setLoading(false);
    }
  }

  return { loading, setLoading, withLoading };
}
