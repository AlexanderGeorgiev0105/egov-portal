-- V15__documents_remove_request_constraint_fix.sql
-- Fix: allow document_id to become NULL for REMOVE_DOCUMENT requests AFTER they are decided,
-- because FK is ON DELETE SET NULL when the document is deleted.

ALTER TABLE document_requests
  DROP CONSTRAINT IF EXISTS chk_document_requests_kind_fields;

ALTER TABLE document_requests
  ADD CONSTRAINT chk_document_requests_kind_fields CHECK (
    (kind = 'ADD_DOCUMENT' AND document_type IS NOT NULL AND document_id IS NULL)
    OR
    (kind = 'REMOVE_DOCUMENT' AND (document_id IS NOT NULL OR status <> 'PENDING'::document_request_status))
  );
