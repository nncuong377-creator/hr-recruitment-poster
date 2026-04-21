'use client';

import { useState, useEffect } from 'react';

interface ExtensionInfo {
  installed: boolean;
  version: string | null;
}

export function useExtension(): ExtensionInfo {
  const [info, setInfo] = useState<ExtensionInfo>({
    installed: false,
    version: null,
  });

  useEffect(() => {
    const check = () => {
      const version = document.documentElement.dataset.hrPosterExtensionVersion;
      setInfo({
        installed: !!version,
        version: version || null,
      });
    };

    check();
    // Re-check sau 500ms và 1500ms vì content script inject sau page load
    const t1 = setTimeout(check, 500);
    const t2 = setTimeout(check, 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return info;
}
