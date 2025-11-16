-- Add ocr_text column to documents table for storing extracted text
ALTER TABLE documents ADD COLUMN ocr_text TEXT;