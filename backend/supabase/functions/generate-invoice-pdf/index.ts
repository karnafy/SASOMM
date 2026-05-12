// Edge Function: generate-invoice-pdf
// Generates Israeli tax invoice (חשבונית מס / קבלה / חשבונית זיכוי) as PDF.
// Acquires sequential_number from invoices table (advisory lock), composes PDF
// with company VAT details, uploads to Supabase Storage, links pdf_url.
// Phase 2

export {};
