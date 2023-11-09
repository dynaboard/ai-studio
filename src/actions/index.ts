import { ShellScriptAction } from '@/actions/shell';
import { WeatherAction } from '@/actions/weather';

export function getAllActions() {
  return [new WeatherAction(), new ShellScriptAction()];
}
