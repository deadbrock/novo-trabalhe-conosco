import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, A11y } from 'swiper/modules'
import { Section } from '@/components/ui/Section/Section'
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader'
import { Text } from '@/components/ui/Text/Text'
import { FadeIn } from '@/components/motion/FadeIn'
import { testimonials as defaultTestimonials } from '@/mocks/testimonials.mock'
import { useCmsSection } from '@/context/CmsContext'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export function TestimonialsSection() {
  const cms = useCmsSection('testimonials', { items: defaultTestimonials })
  const testimonials = cms.items || defaultTestimonials

  return (
    <Section className="bg-brand-blue-800 text-neutral-0 overflow-hidden">
      <SectionHeader
        badge="Depoimentos"
        title="Quem faz a FG Services"
        description="Histórias reais de profissionais que cresceram conosco."
        align="center"
        className="[&_h2]:text-neutral-0 [&_p]:text-neutral-400"
      />

      <FadeIn>
        <Swiper
          modules={[Navigation, Pagination, A11y]}
          spaceBetween={32}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          breakpoints={{
            768: { slidesPerView: 1.2 },
            1024: { slidesPerView: 1.5 },
          }}
          className="testimonials-swiper pb-12!"
          a11y={{
            prevSlideMessage: 'Depoimento anterior',
            nextSlideMessage: 'Próximo depoimento',
          }}
        >
          {testimonials.map((item) => (
            <SwiperSlide key={item.id}>
              <blockquote className="border border-brand-blue-600/50 rounded-2xl p-8 md:p-10 h-full bg-brand-blue-700/30">
                <p className="font-display text-xl md:text-2xl font-medium leading-relaxed text-neutral-100 text-balance">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <footer className="mt-8 pt-6 border-t border-brand-blue-600/50">
                  <cite className="not-italic">
                    <p className="font-display font-semibold text-neutral-0">{item.name}</p>
                    <Text size="sm" color="inverse" className="text-neutral-500 mt-0.5">
                      {item.role} · {item.tenure}
                    </Text>
                  </cite>
                </footer>
              </blockquote>
            </SwiperSlide>
          ))}
        </Swiper>
      </FadeIn>

      <style>{`
        .testimonials-swiper .swiper-button-next,
        .testimonials-swiper .swiper-button-prev {
          color: #fff;
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.08);
          border-radius: 9999px;
        }
        .testimonials-swiper .swiper-button-next::after,
        .testimonials-swiper .swiper-button-prev::after {
          font-size: 14px;
        }
        .testimonials-swiper .swiper-pagination-bullet {
          background: #525252;
          opacity: 1;
        }
        .testimonials-swiper .swiper-pagination-bullet-active {
          background: #fff;
        }
      `}</style>
    </Section>
  )
}
