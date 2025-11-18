import type { RunOracleOptions } from '../oracle.js';
import type { UserConfig } from '../config.js';
import { normalizeModelOption, inferModelFromLabel, resolveApiModel } from '../cli/options.js';
import { resolveEngine, type EngineMode } from '../cli/engine.js';
import { Launcher } from 'chrome-launcher';

export function mapConsultToRunOptions({
  prompt,
  files,
  model,
  engine,
  userConfig,
  env = process.env,
}: {
  prompt: string;
  files: string[];
  model?: string;
  engine?: EngineMode;
  userConfig?: UserConfig;
  env?: NodeJS.ProcessEnv;
}): { runOptions: RunOracleOptions; resolvedEngine: EngineMode } {
  const resolvedEngine: EngineMode = resolveEngineWithConfig({ engine, configEngine: userConfig?.engine, env });

  const cliModelArg = normalizeModelOption(model ?? userConfig?.model) || 'gpt-5-pro';
  const resolvedModel = resolvedEngine === 'browser' ? inferModelFromLabel(cliModelArg) : resolveApiModel(cliModelArg);

  const promptWithSuffix =
    userConfig?.promptSuffix && userConfig.promptSuffix.trim().length > 0
      ? `${prompt.trim()}\n${userConfig.promptSuffix}`
      : prompt;

  const search =
    userConfig?.search === 'off'
      ? false
      : userConfig?.search === 'on'
        ? true
        : true;

  const heartbeatIntervalMs =
    userConfig?.heartbeatSeconds !== undefined ? userConfig.heartbeatSeconds * 1000 : 30_000;

  const runOptions: RunOracleOptions = {
    prompt: promptWithSuffix,
    model: resolvedModel,
    file: files ?? [],
    search,
    heartbeatIntervalMs,
    filesReport: userConfig?.filesReport,
    background: userConfig?.background,
  };

  return { runOptions, resolvedEngine };
}

export function ensureBrowserAvailable(engine: EngineMode): string | null {
  if (engine !== 'browser') {
    return null;
  }
  if (process.env.CHROME_PATH) {
    return null;
  }
  const found = Launcher.getFirstInstallation();
  if (!found) {
    return 'Browser engine unavailable: no Chrome installation found and CHROME_PATH is unset.';
  }
  return null;
}

function resolveEngineWithConfig({
  engine,
  configEngine,
  env,
}: {
  engine?: EngineMode;
  configEngine?: EngineMode;
  env: NodeJS.ProcessEnv;
}): EngineMode {
  if (engine) return engine;
  if (configEngine) return configEngine;
  return resolveEngine({ engine: undefined, env });
}
