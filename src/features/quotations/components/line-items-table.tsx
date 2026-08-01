import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { QuotationLine } from "@/types/entities";

export function LineItemsTable({ lines }: { lines: QuotationLine[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Unit price</TableHead>
          <TableHead className="text-right">Discount</TableHead>
          <TableHead className="text-right">Tax</TableHead>
          <TableHead className="text-right">Line total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => (
          <TableRow key={line.id}>
            <TableCell>{line.description}</TableCell>
            <TableCell className="text-right">{line.qty}</TableCell>
            <TableCell className="text-right">
              ₹{Number(line.unitPrice).toLocaleString("en-IN")}
            </TableCell>
            <TableCell className="text-right">
              ₹{Number(line.discount ?? 0).toLocaleString("en-IN")}
            </TableCell>
            <TableCell className="text-right">
              ₹{Number(line.tax ?? 0).toLocaleString("en-IN")}
            </TableCell>
            <TableCell className="text-right">
              ₹{Number(line.lineTotal ?? 0).toLocaleString("en-IN")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
