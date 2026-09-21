import test from 'node:test';
import assert from 'node:assert/strict';
import { browseDocuments, documentFolders, previewKind } from '../packages/eh-design/src/document-browser-model.ts';

const files = [
  { id: 'i-1', folder: 'invoice', title: 'Rechnung 10', issuer: 'Müller', context: 'Heizung', date: '2026-01-20', href: '/app/invoices/1' },
  { id: 'd-1', folder: 'offer', title: 'Angebot Dach', issuer: 'Schulze', context: 'Dachsanierung', date: '2026-02-01', href: '/api/documents/1' },
  { id: 'i-2', folder: 'invoice', title: 'Rechnung 2', issuer: 'Müller', context: 'Garten', date: '2026-03-01', href: '/app/invoices/2' },
];

test('search finds issuer and context across folders, but respects a chosen folder', () => {
  assert.deepEqual(browseDocuments(files, null, '  MÜLLER  ', 'newest').map(f => f.id), ['i-2', 'i-1']);
  assert.deepEqual(browseDocuments(files, null, 'dachsanierung', 'newest').map(f => f.id), ['d-1']);
  assert.deepEqual(browseDocuments(files, 'offer', 'Müller', 'newest'), []);
});

test('filename sorting is natural and does not mutate server data', () => {
  assert.deepEqual(browseDocuments(files, 'invoice', '', 'name').map(f => f.id), ['i-2', 'i-1']);
  assert.deepEqual(files.map(f => f.id), ['i-1', 'd-1', 'i-2']);
});

test('folders count only their documents and omit empty groups', () => {
  assert.deepEqual(documentFolders(files).map(f => [f.id, f.count]), [['invoice', 2], ['offer', 1]]);
  assert.deepEqual(documentFolders([]), []);
});

test('preview permits PDFs and safe raster formats, never active document types', () => {
  assert.equal(previewKind('scan.PDF'), 'pdf');
  assert.equal(previewKind('photos/roof.JPEG'), 'image');
  assert.equal(previewKind('drawing.svg'), 'none');
  assert.equal(previewKind('document.html'), 'none');
  assert.equal(previewKind(null), 'none');
});
