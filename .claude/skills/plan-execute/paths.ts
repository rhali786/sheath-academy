import * as path from 'path'

export function resolveSkillDir(): string {
  return __dirname
}

export function resolveSkillFile(name: string): string {
  return path.join(resolveSkillDir(), name)
}
