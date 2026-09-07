import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type CellData = { text: string; align?: "left" | "center" | "right" | null };
export type TableData = {
  header: CellData[];
  rows: CellData[][];
};

export function TableWidgetComponent({ data }: { data: TableData }) {
  // We use our shadcn table components which look great
  return (
    <div className="my-4 w-full overflow-y-auto rounded-md border" contentEditable="false" style={{ userSelect: "none" }} onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {data.header.map((cell, i) => (
              <TableHead key={i} className={cell.align ? `text-${cell.align}` : ""}>
                {cell.text.trim()}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex} className={cell.align ? `text-${cell.align}` : ""}>
                  {cell.text.trim()}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
