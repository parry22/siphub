// @ts-nocheck
import { HeroGeometric } from "@/components/ui/shape-landing-hero"
import { LiquidButton } from "@/components/ui/liquid-glass-button";

function DemoHeroGeometric() {
    return <HeroGeometric badge="Kokonut UI"
            title1 = "Elevate Your"
            title2 = "Digital Vision" />
}

export { DemoHeroGeometric }

export default function DemoOne() {
  return (
    <> 
      <div className="relative h-[200px] w-[800px]"> 
        <LiquidButton className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          Liquid Glass
        </LiquidButton> 
      </div>
    </>
  )
} 