import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { UploadService } from '../common/upload/upload.service';
import { LoanApplication } from './models/application.model';

// Fixed APR from the product brief (see frontend src/lib/constants.ts LOAN.apr).
const APR_PERCENT = 10;

function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount) || 0);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

@Injectable()
export class AgreementService {
  private readonly logger = new Logger(AgreementService.name);

  constructor(private readonly upload: UploadService) {}

  // Render the loan agreement PDF into an in-memory buffer.
  private renderPdf(application: LoanApplication): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'LETTER', margin: 64 });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const amount = Number(application.loan_amount) || 0;
        const termMonths = Number(application.loan_term) || 0;
        const monthlyRate = APR_PERCENT / 100 / 12;
        // Standard amortized monthly payment. Falls back to a simple division
        // when the rate is zero so we never divide by zero.
        const monthlyPayment =
          monthlyRate > 0 && termMonths > 0
            ? (amount * monthlyRate) /
              (1 - Math.pow(1 + monthlyRate, -termMonths))
            : termMonths > 0
              ? amount / termMonths
              : amount;
        const totalRepayment = monthlyPayment * termMonths;

        const borrowerName =
          `${application.first_name ?? ''} ${application.last_name ?? ''}`.trim();
        const generatedOn = formatDate(new Date());

        // ── Header ──────────────────────────────────────────────────
        doc
          .fontSize(20)
          .fillColor('#0f172a')
          .text('Loan Agreement', { align: 'center' });
        doc
          .moveDown(0.3)
          .fontSize(10)
          .fillColor('#64748b')
          .text('Northstar Lending, LLC', { align: 'center' })
          .text(`Application ID: ${application.application_id}`, {
            align: 'center',
          })
          .text(`Generated: ${generatedOn}`, { align: 'center' });

        doc.moveDown(1.5).fillColor('#0f172a');

        // ── Parties ─────────────────────────────────────────────────
        doc
          .fontSize(12)
          .text('1. Parties', { underline: true })
          .moveDown(0.3)
          .fontSize(10)
          .fillColor('#334155')
          .text(
            `This Loan Agreement (the "Agreement") is entered into between ` +
              `Northstar Lending, LLC (the "Lender") and ${borrowerName} (the "Borrower").`,
          );

        doc.moveDown(1).fillColor('#0f172a');

        // ── Loan terms ──────────────────────────────────────────────
        doc
          .fontSize(12)
          .text('2. Loan Terms', { underline: true })
          .moveDown(0.5);

        const rows: [string, string][] = [
          ['Borrower', borrowerName || '—'],
          ['Principal Amount', formatUSD(amount)],
          ['Term', `${termMonths} months`],
          ['Fixed APR', `${APR_PERCENT}%`],
          ['Estimated Monthly Payment', formatUSD(monthlyPayment)],
          ['Estimated Total of Payments', formatUSD(totalRepayment)],
        ];

        doc.fontSize(10);
        for (const [label, value] of rows) {
          const y = doc.y;
          doc.fillColor('#64748b').text(label, 64, y, { width: 220 });
          doc.fillColor('#0f172a').text(value, 300, y, { width: 220 });
          doc.moveDown(0.4);
        }

        doc.moveDown(1).fillColor('#0f172a');

        // ── Terms & conditions ──────────────────────────────────────
        doc
          .fontSize(12)
          .text('3. Terms & Conditions', { underline: true })
          .moveDown(0.3)
          .fontSize(9)
          .fillColor('#334155')
          .text(
            'The Borrower agrees to repay the principal amount together with ' +
              'interest accrued at the fixed APR shown above, in equal monthly ' +
              'installments over the stated term. Payments are applied first to ' +
              'accrued interest and then to principal. The Borrower may prepay all ' +
              'or part of the outstanding balance at any time without penalty. ' +
              'Failure to make payments when due may result in late fees and ' +
              'reporting to credit bureaus as permitted by law. This Agreement is ' +
              'governed by applicable federal and state law.',
            { align: 'justify' },
          )
          .moveDown(0.5)
          .text(
            'By electronically signing below, the Borrower acknowledges having ' +
              'read, understood, and agreed to the terms of this Agreement and ' +
              'consents to the use of electronic records and signatures.',
            { align: 'justify' },
          );

        doc.moveDown(2).fillColor('#0f172a');

        // ── Signature block ─────────────────────────────────────────
        doc.fontSize(12).text('4. Borrower Signature', { underline: true });
        doc.moveDown(2);
        const lineY = doc.y;
        doc
          .moveTo(64, lineY)
          .lineTo(300, lineY)
          .strokeColor('#94a3b8')
          .stroke();
        doc
          .fontSize(9)
          .fillColor('#64748b')
          .text(
            'Borrower signature (typed name + date captured online)',
            64,
            lineY + 4,
          );

        doc.end();
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  // Generate the agreement PDF for an application and store it. Returns the
  // storage object key. Callers persist the key on the application record.
  async generateAndStore(application: LoanApplication): Promise<string> {
    const pdf = await this.renderPdf(application);
    const key = await this.upload.saveBuffer(pdf, '.pdf', 'application/pdf');
    this.logger.log(
      `Generated loan agreement for ${application.application_id} → ${key}`,
    );
    return key;
  }
}
