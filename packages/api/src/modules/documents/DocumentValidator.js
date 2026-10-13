export class DocumentValidator {
  static assertUuid(value, fieldName = 'id') {
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!value || !uuidRe.test(String(value))) {
      const error = new Error('INVALID_ID')
      error.field = fieldName
      throw error
    }
  }

  static validateSignPayload(body = {}) {
    if (body.returnUrl !== undefined && typeof body.returnUrl !== 'string') {
      throw new Error('INVALID_RETURN_URL')
    }
    return {
      returnUrl: body.returnUrl || null,
      candidateId: body.candidate_id || body.candidateId || null,
    }
  }
}
