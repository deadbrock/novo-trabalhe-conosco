import { useCallback } from 'react'
import { DocumentPreviewModal } from '@/components/DocumentPreviewModal'
import { candidatesService } from '@/services/candidatesService'

export function DocumentationItemPreviewModal({
  candidateId,
  applicationId,
  item,
  onClose,
}) {
  const loadPreviewUrl = useCallback(
    () => candidatesService.getDocumentationItemPreviewUrl(candidateId, applicationId, item.id),
    [candidateId, applicationId, item.id],
  )

  const handleDownload = useCallback(
    () =>
      candidatesService.downloadDocumentationItem(
        candidateId,
        applicationId,
        item.id,
        item.documentFileName || 'documento.pdf',
      ),
    [candidateId, applicationId, item.id, item.documentFileName],
  )

  return (
    <DocumentPreviewModal
      item={item}
      onClose={onClose}
      loadPreviewUrl={loadPreviewUrl}
      onDownload={handleDownload}
    />
  )
}
