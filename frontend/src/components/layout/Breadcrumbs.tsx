import React from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => (
  <nav className="flex text-sm text-text-secondary" aria-label="Breadcrumb">
    <ol className="inline-flex items-center space-x-1">
      {items.map((item, idx) => (
        <li key={item.label} className="inline-flex items-center">
          {item.href && idx !== items.length - 1 ? (
            <a href={item.href} className="text-accent hover:text-accent-hover focus:outline-none" style={{ color: 'var(--accent, #16a34a)' }}>
              {item.label}
            </a>
          ) : (
            <span className="text-text-primary font-medium">{item.label}</span>
          )}
          {idx < items.length - 1 && <span className="mx-2 text-border">/</span>}
        </li>
      ))}
    </ol>
  </nav>
); 