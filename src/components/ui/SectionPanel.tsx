import type { ReactNode } from "react";
import styles from "./SectionPanel.module.css";

type SectionPanelProps = {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
};

export default function SectionPanel({ title, eyebrow, action, children }: SectionPanelProps) {
  return (
    <section className="panel">
      <div className={styles.heading}>
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
