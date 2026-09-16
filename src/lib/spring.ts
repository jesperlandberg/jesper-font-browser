// Damped harmonic oscillator, solved in closed form. Extracted from
// @lama/motion (MIT, my own library): the scalar solver and the pointer
// velocity tracker, which is all this app needs.
//
// The step re-derives from the current state each frame, so retargeting
// mid-flight never jumps — which a duration-and-easing transition cannot do.

const REST_VELOCITY = 0.001
const REST_DISPLACEMENT = 0.001

export type SpringParams = { response: number; dampingRatio?: number; mass?: number }

type Physical = { stiffness: number; damping: number; mass: number }

function toPhysical({ response, dampingRatio = 1, mass = 1 }: SpringParams): Physical {
    const omega = (2 * Math.PI) / Math.max(response, 1e-4)
    const stiffness = mass * omega * omega
    return { stiffness, damping: 2 * dampingRatio * Math.sqrt(stiffness * mass), mass }
}

type Coefficients = { a: number; b: number; c: number; d: number }

function coefficients({ stiffness, damping, mass }: Physical, dt: number): Coefficients {
    const omega = Math.sqrt(stiffness / mass)
    const zeta = damping / (2 * Math.sqrt(stiffness * mass))

    if (zeta < 1) {
        const omegaD = omega * Math.sqrt(1 - zeta * zeta)
        const decay = Math.exp(-zeta * omega * dt)
        const cos = Math.cos(omegaD * dt)
        const sin = Math.sin(omegaD * dt)
        const za = zeta * omega
        return {
            a: decay * (cos + (za / omegaD) * sin),
            b: decay * (sin / omegaD),
            c: decay * (-((za * za) / omegaD) - omegaD) * sin,
            d: decay * (cos - (za / omegaD) * sin),
        }
    }

    if (zeta === 1) {
        const decay = Math.exp(-omega * dt)
        return {
            a: decay * (1 + omega * dt),
            b: decay * dt,
            c: decay * -(omega * omega) * dt,
            d: decay * (1 - omega * dt),
        }
    }

    const root = Math.sqrt(zeta * zeta - 1)
    const r1 = -omega * (zeta - root)
    const r2 = -omega * (zeta + root)
    const e1 = Math.exp(r1 * dt)
    const e2 = Math.exp(r2 * dt)
    const inverse = 1 / (r1 - r2)
    return {
        a: (-r2 * e1 + r1 * e2) * inverse,
        b: (e1 - e2) * inverse,
        c: (-r1 * r2 * e1 + r1 * r2 * e2) * inverse,
        d: (r1 * e1 - r2 * e2) * inverse,
    }
}

export class Spring {
    value: number
    velocity = 0
    target: number
    sleeping = true
    private physical: Physical

    constructor(initial: number, params: SpringParams) {
        this.value = initial
        this.target = initial
        this.physical = toPhysical(params)
    }

    setTarget(target: number): void {
        if (target === this.target) return
        this.target = target
        this.sleeping = false
    }

    addVelocity(amount: number): void {
        if (amount === 0) return
        this.velocity += amount
        this.sleeping = false
    }

    snap(value: number): void {
        this.value = value
        this.target = value
        this.velocity = 0
        this.sleeping = true
    }

    step(dt: number): boolean {
        if (this.sleeping) return false

        const { a, b, c, d } = coefficients(this.physical, dt)
        const x = this.value - this.target
        const v = this.velocity
        const nextX = a * x + b * v
        const nextV = c * x + d * v

        if (Math.abs(nextX) < REST_DISPLACEMENT && Math.abs(nextV) < REST_VELOCITY) {
            this.value = this.target
            this.velocity = 0
            this.sleeping = true
            return false
        }

        this.value = this.target + nextX
        this.velocity = nextV
        return true
    }
}

export class VelocityTracker {
    private times: number[] = []
    private values: number[] = []

    constructor(private readonly window = 0.1) {}

    add(value: number, time: number): void {
        this.times.push(time)
        this.values.push(value)
        if (this.times.length > 32) {
            this.times.shift()
            this.values.shift()
        }
    }

    velocity(): number {
        const count = this.times.length
        if (count < 2) return 0

        const last = this.times[count - 1]!
        let index = count - 1
        while (index > 0 && last - this.times[index - 1]! <= this.window) index--
        if (index === count - 1) index = count - 2

        const span = last - this.times[index]!
        if (span <= 0) return 0
        return (this.values[count - 1]! - this.values[index]!) / Math.max(span, 1 / 120)
    }
}
