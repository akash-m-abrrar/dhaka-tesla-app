import {
  ArrowDown,
  ArrowRight,
  Check,
  CircleDollarSign,
  MapPin,
  Smartphone,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/site/container";
import { SiteHeader } from "@/components/site/site-header";

const steps = [
  {
    number: "01",
    title: "Choose your route",
    description:
      "Set your pickup and destination zones, then choose how many seats you need.",
    icon: MapPin,
    visual: "route",
  },
  {
    number: "02",
    title: "Send your request",
    description:
      "Submit your ride request so a driver can review it and add it to a pool.",
    icon: UsersRound,
    visual: "match",
  },
  {
    number: "03",
    title: "Take the trip",
    description:
      "After a driver adds your request to a pool, meet them on arrival and follow the trip through completion.",
    icon: Smartphone,
    visual: "ride",
  },
  {
    number: "04",
    title: "Pay after completion",
    description:
      "When your ride is complete, choose Cash or TeslaPay. TeslaPay is currently simulated.",
    icon: CircleDollarSign,
    visual: "payment",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden border-b border-border/60"
          id="home"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-36 -top-40 size-[480px] rounded-full bg-white/70 blur-3xl dark:bg-white/[0.03]"
          />
          <Container className="relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:gap-20 lg:py-24">
            <div className="max-w-[590px]">
              <p className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.19em] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-foreground" />
                A simpler way to get around Dhaka
              </p>
              <h1
                className="max-w-[600px] text-5xl font-semibold leading-[1.04] tracking-[-0.065em] sm:text-6xl lg:text-[68px]"
                id="hero-title"
              >
                Get ready for your first trip.
              </h1>
              <p className="mt-6 max-w-[490px] text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                A clear, comfortable way to plan your next ride. Start with the
                places you know; we’ll make the journey easier to picture.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  href="#get-started"
                >
                  See how it works
                  <ArrowRight aria-hidden="true" className="size-4" />
                </a>
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors hover:bg-muted"
                  href="#how-it-works"
                >
                  Explore the experience
                </a>
              </div>
              <p className="mt-5 max-w-md text-xs leading-5 text-muted-foreground">
                Ride booking is not live yet. This page is a preview and won’t
                submit a ride request.
              </p>
            </div>

            <div className="mx-auto w-full max-w-[520px]">
              <div className="overflow-hidden rounded-[28px] border border-border bg-card p-4 shadow-[0_28px_80px_-44px_rgba(0,0,0,0.32)] sm:p-5">
                <div className="flex items-center justify-between px-1 pb-4">
                  <div>
                    <p className="text-sm font-semibold">Plan a ride</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      A Dhaka trip preview
                    </p>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                    PREVIEW
                  </span>
                </div>

                <div className="relative h-[190px] overflow-hidden rounded-2xl bg-[#efeee9] dark:bg-[#292a28] sm:h-[220px]">
                  <svg
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full"
                    fill="none"
                    preserveAspectRatio="xMidYMid slice"
                    viewBox="0 0 520 260"
                  >
                    <path d="M-20 42 160 95l118-68 270 82M-24 208l163-78 127 101 252-93M84-20l34 90 114 62 50 152M404-10l-32 99-75 73 17 112" stroke="white" strokeWidth="18" />
                    <path d="M-20 42 160 95l118-68 270 82M-24 208l163-78 127 101 252-93M84-20l34 90 114 62 50 152M404-10l-32 99-75 73 17 112" stroke="#d9d8d2" strokeWidth="2" />
                    <path d="M123 153c45-12 61-52 108-53 43-1 60 56 105 55 39-1 43-49 86-54" stroke="#161715" strokeDasharray="5 8" strokeLinecap="round" strokeWidth="3" />
                    <circle cx="123" cy="153" r="10" fill="#161715" stroke="white" strokeWidth="5" />
                    <circle cx="422" cy="101" r="10" fill="#161715" stroke="white" strokeWidth="5" />
                    <circle cx="262" cy="72" r="3" fill="#c7c5bd" />
                    <circle cx="323" cy="204" r="3" fill="#c7c5bd" />
                    <circle cx="92" cy="211" r="3" fill="#c7c5bd" />
                  </svg>
                  <div className="absolute bottom-3 left-3 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-neutral-800 shadow-sm backdrop-blur">
                    Dhaka, Bangladesh
                  </div>
                </div>

                <div className="grid grid-cols-[28px_1fr] gap-x-3 px-2 py-5 sm:px-3">
                  <div className="flex flex-col items-center pt-1">
                    <span className="size-2.5 rounded-full border-2 border-foreground" />
                    <span className="my-1 h-9 border-l border-dashed border-muted-foreground/60" />
                    <span className="size-2.5 rounded-[3px] bg-foreground" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Pickup location
                      </p>
                      <p className="mt-1 text-sm font-semibold">Alook Tower</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Dropoff location
                      </p>
                      <p className="mt-1 text-sm font-medium text-muted-foreground">
                        Choose a destination
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border px-2 pt-4 sm:px-3">
                  <span className="text-xs text-muted-foreground">
                    Your route, at a glance
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                    <span className="size-1.5 rounded-full bg-foreground" />
                    Not submitted
                  </span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section
          aria-labelledby="steps-title"
          className="py-20 sm:py-28"
          id="how-it-works"
        >
          <Container>
            <div className="max-w-[620px]">
              <p className="text-xs font-semibold uppercase tracking-[0.19em] text-muted-foreground">
                A few simple steps
              </p>
              <h2
                className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl"
                id="steps-title"
              >
                Book your trip on your phone or computer.
              </h2>
              <p className="mt-5 max-w-[500px] text-base leading-7 text-muted-foreground">
                From sending your request to paying after the ride, each step is
                easy to follow.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-4">
              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <article
                    className="group rounded-[24px] border border-border bg-card p-5 transition-transform hover:-translate-y-1 sm:p-6"
                    key={step.number}
                  >
                    <div className="relative mb-7 flex h-[155px] items-center justify-center overflow-hidden rounded-2xl bg-muted sm:h-[175px]">
                      <div
                        aria-hidden="true"
                        className="absolute size-36 rounded-full border border-border/80"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute size-24 rounded-full border border-border/80"
                      />
                      {step.visual === "route" && (
                        <div className="relative flex items-center gap-5 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
                          <MapPin aria-hidden="true" className="size-5" />
                          <span className="h-px w-12 border-t border-dashed border-muted-foreground" />
                          <MapPin aria-hidden="true" className="size-5 fill-foreground text-background" />
                        </div>
                      )}
                      {step.visual === "payment" && (
                        <div className="relative w-[190px] rounded-2xl border border-border bg-card p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Trip total
                            </span>
                            <CircleDollarSign aria-hidden="true" className="size-4" />
                          </div>
                          <div className="mt-3 h-2 w-20 rounded-full bg-foreground/80" />
                          <div className="mt-2 h-1.5 w-28 rounded-full bg-border" />
                        </div>
                      )}
                      {step.visual === "match" && (
                        <div className="relative flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                          <span className="grid size-10 place-items-center rounded-full bg-muted">
                            <UsersRound aria-hidden="true" className="size-5" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold">Added to a pool</p>
                            <p className="mt-1 text-[10px] text-muted-foreground">Driver matched</p>
                          </div>
                          <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-foreground text-background">
                            <Check aria-hidden="true" className="size-3.5" />
                          </span>
                        </div>
                      )}
                      {step.visual === "ride" && (
                        <div className="relative flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                          <span className="grid size-10 place-items-center rounded-full bg-muted">
                            <Smartphone aria-hidden="true" className="size-5" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold">Ride in progress</p>
                            <p className="mt-1 text-[10px] text-muted-foreground">Completed trip</p>
                          </div>
                          <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-foreground text-background">
                            <Check aria-hidden="true" className="size-3.5" />
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground">
                        STEP {step.number}
                      </span>
                      <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold tracking-[-0.035em]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </Container>
        </section>

        <section
          aria-labelledby="about-title"
          className="border-y border-border bg-card py-16 sm:py-20"
          id="about"
        >
          <Container className="grid gap-8 md:grid-cols-[0.75fr_1fr] md:items-center">
            <p className="text-xs font-semibold uppercase tracking-[0.19em] text-muted-foreground">
              Made for the rhythm of Dhaka
            </p>
            <div>
              <h2
                className="max-w-[670px] text-2xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl"
                id="about-title"
              >
                A little more clarity can make the whole trip feel easier.
              </h2>
              <p className="mt-4 max-w-[600px] text-sm leading-7 text-muted-foreground sm:text-base">
                Tesla Bullet is being built around the details that matter:
                where you’re going, what your trip may cost, and how to meet
                your driver.
              </p>
            </div>
          </Container>
        </section>

        <section aria-labelledby="get-started-title" className="py-16 sm:py-24" id="get-started">
          <Container>
            <div className="relative overflow-hidden rounded-[28px] bg-foreground px-6 py-10 text-background sm:px-10 sm:py-14 lg:px-16">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-36 size-80 rounded-full border border-background/15"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-24 size-56 rounded-full border border-background/15"
              />
              <div className="relative max-w-[650px]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/65">
                  The road ahead
                </p>
                <h2
                  className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl"
                  id="get-started-title"
                >
                  Your first ride is on the horizon.
                </h2>
                <p className="mt-4 max-w-[550px] text-sm leading-6 text-background/70 sm:text-base sm:leading-7">
                  We’re getting the booking experience ready. Sign-in and ride
                  requests are not available yet, but you can explore how the
                  service will work.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    className="h-12 rounded-full px-6 text-sm font-semibold"
                    disabled
                    type="button"
                  >
                    Book your first ride
                    <ArrowRight aria-hidden="true" />
                  </Button>
                  <a
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-background transition-colors hover:bg-background/10"
                    href="#how-it-works"
                  >
                    How it works <ArrowDown aria-hidden="true" className="size-4" />
                  </a>
                </div>
                <p className="mt-3 text-xs text-background/55">
                  Booking will open here when the service is ready.
                </p>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <footer className="border-t border-border bg-card" id="contact">
        <Container className="py-10 sm:py-12">
          <div className="grid gap-9 sm:grid-cols-2 sm:items-start lg:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <a className="inline-flex items-center gap-3" href="#home">
                <span className="grid size-9 place-items-center rounded-xl bg-foreground text-sm font-bold tracking-[-0.08em] text-background">
                  TB
                </span>
                <span className="text-sm font-semibold tracking-[0.12em]">
                  TESLA BULLET
                </span>
              </a>
              <p className="mt-4 max-w-[310px] text-sm leading-6 text-muted-foreground">
                A clearer way to plan your next trip around Dhaka.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Explore</p>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li><a className="hover:text-foreground" href="#home">Home</a></li>
                <li><a className="hover:text-foreground" href="#how-it-works">How it works</a></li>
                <li><a className="hover:text-foreground" href="#about">About</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Support</p>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li><a className="hover:text-foreground" href="#contact">Contact</a></li>
                <li><a className="hover:text-foreground" href="#get-started">Help and updates</a></li>
              </ul>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Support details will be available when booking opens.
              </p>
            </div>
          </div>
          <div className="mt-9 flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Tesla Bullet</p>
            <p>Thoughtful trips, one ride at a time.</p>
          </div>
        </Container>
      </footer>
    </>
  );
}
