import { spawnSync, SpawnSyncOptions, SpawnSyncReturns } from 'child_process'

export function spawnClaude(args: string[], options: SpawnSyncOptions = {}): SpawnSyncReturns<string> {
  return spawnSync('claude', args, options) as SpawnSyncReturns<string>
}
