import { createContext, useContext, useState, type ReactNode } from 'react';

interface PrivacyCtx {
  financeLocked: boolean;
  mindLocked: boolean;
  toggleFinance: () => void;
  toggleMind: () => void;
}

const PrivacyContext = createContext<PrivacyCtx>({
  financeLocked: true, mindLocked: true,
  toggleFinance: () => {}, toggleMind: () => {},
});

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [financeLocked, setFinance] = useState(true);
  const [mindLocked, setMind] = useState(true);
  return (
    <PrivacyContext.Provider value={{
      financeLocked, mindLocked,
      toggleFinance: () => setFinance(p => !p),
      toggleMind: () => setMind(p => !p),
    }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() { return useContext(PrivacyContext); }

/** Wrap sensitive content — blurred when locked, click to reveal */
export function Sensitive({ type, children, inline }: { type: 'finance' | 'mind'; children: ReactNode; inline?: boolean }) {
  const { financeLocked, mindLocked, toggleFinance, toggleMind } = usePrivacy();
  const locked = type === 'finance' ? financeLocked : mindLocked;
  const toggle = type === 'finance' ? toggleFinance : toggleMind;

  if (!locked) return <>{children}</>;

  const Tag = inline ? 'span' : 'div';
  return (
    <Tag
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      className="sensitive-blur"
      style={{ cursor: 'pointer', position: 'relative' }}
      title="Tap to reveal"
    >
      {children}
    </Tag>
  );
}
