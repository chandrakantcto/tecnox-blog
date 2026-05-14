import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [React.RefCallback<Element>, boolean] {
  const { threshold = 0, root = null, rootMargin = '0%', freezeOnceVisible = false } = options;
  const [isVisible, setIsVisible] = useState(false);
  const frozen = useRef(false);

  const refCallback: React.RefCallback<Element> = (node) => {
    if (node && !frozen.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          const visible = entry.isIntersecting;
          setIsVisible(visible);
          if (visible && freezeOnceVisible) {
            frozen.current = true;
            observer.disconnect();
          }
        },
        { threshold, root, rootMargin }
      );
      observer.observe(node);
    }
  };

  return [refCallback, isVisible];
}
