import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import React from "react";
import { Button } from "../atoms/button";
import { cn } from "@/lib/utils";
import RowsPerPageSelect from "./RowsPerPageSelect";

interface PaginationProps {
  currentPage: number;
  totalData: number;
  onPageChange: (page: number) => void;
  showRows?: number;
  onShowRowsChange?: (rows: number) => void;
  rowsOptions?: ReadonlyArray<{ value: string; label: string }>;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalData,
  onPageChange,
  showRows = 10,
  onShowRowsChange,
  rowsOptions,
  className,
}) => {
  const totalPages = Math.ceil(totalData / showRows);
  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === "number") {
      onPageChange(page);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-2 sm:gap-1 items-center justify-between p-2 border-t border-border",
        className
      )}
    >
      {/* Left side - Show rows selector */}
      <div className="flex items-center">
        <RowsPerPageSelect
          value={showRows}
          onChange={(value) => onShowRowsChange?.(Number(value))}
          options={rowsOptions}
        />
      </div>

      {/* Page numbers */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          {/* Previous button */}
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="cursor-pointer disabled:cursor-not-allowed size-8"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>

          {/* Page numbers */}
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="flex items-center justify-center size-6 sm:size-8 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  type="button"
                  variant={page === currentPage ? "default" : "outline"}
                  onClick={() => handlePageClick(page)}
                  className="cursor-pointer min-w-8"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}

          {/* Next button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="cursor-pointer disabled:cursor-not-allowed size-8"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      )}

      {/* Right side - empty for balance */}
    </div>
  );
};

export default Pagination;
