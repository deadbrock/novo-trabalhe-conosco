import {
  Mail,
  Phone,
  MapPin,
  Link2,
  Briefcase,
  User,
  GraduationCap,
  IdCard,
  Calendar,
} from 'lucide-react'
import {
  formatBirthDate,
  formatExperiencePeriod,
  locationLabel,
} from './candidateUtils'

export function CandidateProfileContent({ candidate }) {
  return (
    <div className="space-y-6 text-sm">
      <Section title="Contato">
        <InfoRow icon={Mail} label="E-mail" value={candidate.email} />
        <InfoRow icon={Phone} label="Telefone" value={candidate.phone} />
        <InfoRow icon={IdCard} label="CPF" value={candidate.cpf || '—'} />
        <InfoRow icon={Calendar} label="Data de nascimento" value={formatBirthDate(candidate.birthDate)} />
      </Section>

      <Section title="Endereço">
        <InfoRow
          icon={MapPin}
          label="Endereço completo"
          value={candidate.fullAddress || locationLabel(candidate.city, candidate.state)}
        />
        {candidate.street && (
          <div className="grid sm:grid-cols-2 gap-3 text-neutral-700">
            <DetailItem label="Logradouro" value={candidate.street} />
            <DetailItem label="Número" value={candidate.addressNumber} />
            <DetailItem label="Complemento" value={candidate.complement} />
            <DetailItem label="Bairro" value={candidate.neighborhood} />
            <DetailItem label="CEP" value={candidate.zipCode} />
            <DetailItem label="Cidade/UF" value={locationLabel(candidate.city, candidate.state)} />
          </div>
        )}
      </Section>

      <Section title="Formação">
        <InfoRow icon={GraduationCap} label="Escolaridade" value={candidate.educationLevelLabel || '—'} />
        {candidate.linkedin && (
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">LinkedIn</p>
            <a
              href={candidate.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#003d7a] hover:underline break-all"
            >
              <Link2 size={14} />
              {candidate.linkedin}
            </a>
          </div>
        )}
        {candidate.summary && (
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">Resumo profissional</p>
            <p className="text-neutral-700 whitespace-pre-wrap">{candidate.summary}</p>
          </div>
        )}
      </Section>

      <Section title="Experiências profissionais">
        {candidate.experiences?.length ? (
          <ul className="space-y-3">
            {candidate.experiences.map((experience, index) => (
              <li key={`${experience.company}-${index}`} className="rounded-lg border border-neutral-200 p-3 bg-neutral-50/50">
                <p className="font-medium text-neutral-900">{experience.role || 'Cargo não informado'}</p>
                <p className="text-neutral-700">{experience.company || 'Empresa não informada'}</p>
                <p className="text-xs text-neutral-500 mt-1">{formatExperiencePeriod(experience)}</p>
                {experience.description && (
                  <p className="text-neutral-600 mt-2 whitespace-pre-wrap">{experience.description}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Briefcase} text="Nenhuma experiência cadastrada." />
        )}
      </Section>

      <Section title="Cursos e certificações">
        {candidate.courses?.length ? (
          <ul className="space-y-3">
            {candidate.courses.map((course, index) => (
              <li key={`${course.name}-${index}`} className="rounded-lg border border-neutral-200 p-3 bg-neutral-50/50">
                <p className="font-medium text-neutral-900">{course.name || 'Curso sem nome'}</p>
                <p className="text-neutral-700">{course.institution || 'Instituição não informada'}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {[course.completionYear && `Conclusão: ${course.completionYear}`, course.workloadHours && `${course.workloadHours}`]
                    .filter(Boolean)
                    .join(' · ') || 'Detalhes não informados'}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={User} text="Nenhum curso cadastrado." />
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs uppercase tracking-wide text-neutral-400 font-semibold">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">{label}</p>
      <p className="inline-flex items-center gap-1.5 text-neutral-800 break-all">
        <Icon size={14} className="text-neutral-400 shrink-0" />
        {value || '—'}
      </p>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="text-neutral-800">{value || '—'}</p>
    </div>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <p className="text-neutral-500 text-sm flex items-center gap-1.5">
      <Icon size={14} />
      {text}
    </p>
  )
}
