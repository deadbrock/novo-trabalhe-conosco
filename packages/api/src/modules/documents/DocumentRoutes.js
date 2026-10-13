import { Router } from 'express'
import { requireCandidate, requireStaff, requirePermission } from '../../middleware/auth.js'
import { documentController } from './DocumentController.js'

const router = Router()

router.use(requireCandidate)

router.get('/', documentController.listMine)
router.post('/:id/sign', documentController.sign)
router.get('/:id/status', documentController.status)
router.get('/:id/download', documentController.download)
router.get('/:id/certificate', documentController.certificate)

export default router

export function createAdminDocumentRoutes() {
  const adminRouter = Router()
  adminRouter.use(requireStaff)

  adminRouter.get(
    '/candidates/:candidateId/documents',
    requirePermission('candidates:read'),
    documentController.adminList,
  )
  adminRouter.get(
    '/documents/:id/timeline',
    requirePermission('candidates:read'),
    documentController.adminTimeline,
  )
  adminRouter.get(
    '/documents/:id/download',
    requirePermission('candidates:read'),
    documentController.adminDownload,
  )
  adminRouter.get(
    '/documents/:id/certificate',
    requirePermission('candidates:read'),
    documentController.adminCertificate,
  )

  return adminRouter
}
