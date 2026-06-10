export const GREETINGS = [
  'Marhaban',
  'Ahlan',
  'Salam',
  'Ahlan wasahlan',
  'Sabahul khayr',
  'Marhaba',
  'Ya ahlan',
]

export function pickGreeting(seed?: number): string {
  const idx =
    seed !== undefined
      ? seed % GREETINGS.length
      : Math.floor(Math.random() * GREETINGS.length)
  return GREETINGS[idx]
}
