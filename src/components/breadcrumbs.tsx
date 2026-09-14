import { Fragment } from 'react';
import { EHText, EHTextLink } from '@/design-system';

export type Crumb = { href?: string; label: string };

/**
 * Orientation aid for pages below the first level. Built from canonical text
 * components on purpose - a stylesheet of its own would be rejected by the
 * design guard, and the trail carries no styling of its own.
 */
export function Breadcrumbs({ trail }: { trail: readonly Crumb[] }) {
  if (trail.length === 0) return null;
  return (
    <nav aria-label="Sie sind hier">
      <EHText size="meta" muted>
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? <span aria-hidden="true"> › </span> : null}
              {crumb.href && !last
                ? <EHTextLink href={crumb.href}>{crumb.label}</EHTextLink>
                : <span aria-current="page">{crumb.label}</span>}
            </Fragment>
          );
        })}
      </EHText>
    </nav>
  );
}
