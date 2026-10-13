import { syncPreAdmissionDocumentationLinks } from '../src/services/preAdmission.service.js'
import { syncMissingApplicationDocumentations } from '../src/services/applicationDocumentation.service.js'

console.log('→ Sincronizando documentação...')
await syncMissingApplicationDocumentations()

console.log('→ Vinculando pré-admissão à documentação...')
const linked = await syncPreAdmissionDocumentationLinks()
console.log(`✓ ${linked} caso(s) vinculado(s)`)

process.exit(0)
