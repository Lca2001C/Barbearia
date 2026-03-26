'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Scissors, Clock, Star, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { BrandLogo } from '@/components/BrandLogo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import api from '@/lib/api'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  active: boolean
}

const featuredCuts = [
  {
    title: 'Platinado moderno',
    description: 'Acabamento limpo com visual marcante e personalidade.',
    image: '/corte-exemplo-1.png',
  },
  {
    title: 'Risco personalizado',
    description: 'Degradê com detalhe artístico para destacar seu estilo.',
    image: '/corte-exemplo-2.png',
  },
  {
    title: 'Infantil estiloso',
    description: 'Corte criativo e confortável para os pequenos.',
    image: '/corte-exemplo-3.png',
  },
]

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    api
      .get('/services')
      .then((res) => setServices(res.data.data?.slice(0, 6) || []))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen">
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5">
              <Scissors className="h-4 w-4 text-zinc-200" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">
                Cia do Disfarce
              </span>
            </div>

            <h1 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Sua barbearia de confiança para corte, barba e estilo.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-300 sm:text-xl">
              Da tesoura clássica aos cortes modernos com risco, cada atendimento
              é feito com técnica, atenção e acabamento de alto nível.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/booking">
                <Button size="lg">
                  Agendar Meu Horário
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="#cortes">
                <Button variant="secondary" size="lg">
                  Ver Cortes em Destaque
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                Atendimento profissional
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-amber-300">
                <Sparkles className="h-4 w-4" />
                Visual personalizado
              </div>
            </div>

            <div className="mt-10 flex items-center gap-8">
              <div>
                <p className="text-2xl font-bold text-white">500+</p>
                <p className="text-sm text-slate-400">Clientes Atendidos</p>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div>
                <p className="text-2xl font-bold text-white">4.9</p>
                <p className="text-sm text-slate-400">Avaliação Média</p>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div>
                <p className="text-2xl font-bold text-white">5+</p>
                <p className="text-sm text-slate-400">Profissionais</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-tr from-zinc-700/40 via-white/0 to-amber-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 shadow-2xl">
              <div className="mb-5 rounded-2xl border border-white/10 bg-black p-5">
                <Image
                  src="/logo-cia-do-disfarce.png"
                  alt="Logo Cia do Disfarce"
                  width={600}
                  height={350}
                  className="h-auto w-full object-contain"
                  priority
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {featuredCuts.map((cut) => (
                  <div key={cut.title} className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    <div className="relative h-28 w-full">
                      <Image src={cut.image} alt={cut.title} fill className="object-cover" />
                    </div>
                    <p className="px-2 py-2 text-center text-xs text-zinc-300">
                      {cut.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="cortes" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Cortes em destaque
          </h2>
          <p className="mt-3 text-zinc-400">
            Inspirações reais feitas aqui na Cia do Disfarce.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {featuredCuts.map((cut) => (
            <article
              key={cut.title}
              className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 shadow-xl"
            >
              <div className="relative h-72 w-full">
                <Image src={cut.image} alt={cut.title} fill className="object-cover" />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-white">{cut.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {cut.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="servicos" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Serviços da barbearia
          </h2>
          <p className="mt-3 text-zinc-400">
            Escolha o serviço ideal e reserve seu horário em poucos cliques.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.length > 0
            ? services.map((service) => (
                <Card key={service.id} hover>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                    <Scissors className="h-6 w-6 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {service.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {service.description || 'Atendimento profissional com acabamento premium'}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-amber-500">
                      R$ {Number(service.price).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-slate-400">
                      <Clock className="h-4 w-4" />
                      {service.duration} min
                    </span>
                  </div>
                </Card>
              ))
            : [1, 2, 3].map((i) => (
                <Card key={i} hover>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                    <Scissors className="h-6 w-6 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {i === 1
                      ? 'Corte Clássico'
                      : i === 2
                        ? 'Barba Completa'
                        : 'Corte + Barba'}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Serviço profissional de alta qualidade
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-amber-500">
                      R$ {i === 1 ? '45,00' : i === 2 ? '35,00' : '70,00'}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-slate-400">
                      <Clock className="h-4 w-4" />
                      {i === 1 ? 30 : i === 2 ? 20 : 50} min
                    </span>
                  </div>
                </Card>
              ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/booking">
            <Button size="lg">
                  Ver Todos e Agendar
              <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
                Sobre a <span className="text-zinc-100">Cia do Disfarce Barber Shop</span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-400">
                Somos uma barbearia com identidade forte, ambiente acolhedor e foco
                em resultado. Aqui você encontra corte, barba e estilo pensados para
                valorizar seu visual.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-slate-400">
                Trabalhamos com atendimento personalizado, higiene rigorosa e técnicas
                atualizadas para cortes clássicos, modernos e infantis.
              </p>
              <div className="mt-6 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="h-5 w-5 fill-amber-500 text-amber-500"
                  />
                ))}
                <span className="ml-2 text-sm text-slate-400">
                  4.9 de 5 estrelas
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative flex h-72 w-72 items-center justify-center rounded-2xl border border-white/10 bg-black p-6 shadow-2xl ring-1 ring-white/10 sm:h-80 sm:w-80">
                <Image
                  src="/logo-cia-do-disfarce.png"
                  alt="Cia do Disfarce"
                  width={500}
                  height={300}
                  className="h-auto w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <BrandLogo size="sm" />
            <p className="text-center text-sm text-zinc-500 sm:text-right">
              &copy; {new Date().getFullYear()} Cia do Disfarce — Barber Shop.
              <br className="sm:hidden" /> Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
