import type { ReactNode } from 'react';

// Every screen opens with the same head: left rule, one title size, optional line and action.
export function PageHead({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div className="page-head-text">
        <h1 data-role="page-title">{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
