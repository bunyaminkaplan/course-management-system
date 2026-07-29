import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  if (totalPages <= 1) return null;

  // Calculate range of items currently displayed
  let summaryText = '';
  if (totalItems !== undefined && itemsPerPage !== undefined) {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    summaryText = `Gösterilen: ${startItem}-${endItem} / Toplam ${totalItems}`;
  }

  // Generate page numbers array with intelligent ellipsis if needed
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="pagination-container flex-row">
      {summaryText && <div className="pagination-summary">{summaryText}</div>}

      <div className="pagination-controls flex-row">
        <button
          className="pagination-btn icon-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Önceki Sayfa"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page, index) => {
          if (typeof page === 'string') {
            return (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                {page}
              </span>
            );
          }
          return (
            <button
              key={page}
              className={`pagination-btn page-num ${currentPage === page ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          );
        })}

        <button
          className="pagination-btn icon-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Sonraki Sayfa"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
