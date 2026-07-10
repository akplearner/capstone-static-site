import { describe, it, expect } from 'vitest';
import { splitCommand } from './commands';

describe('splitCommand', () => {
  it('returns a single-element array for a lone command', () => {
    expect(splitCommand('nmap -sV 10.10.10.5')).toEqual(['nmap -sV 10.10.10.5']);
  });

  it('splits on top-level && and trims', () => {
    expect(splitCommand('sudo ufw allow 22 && sudo ufw allow 80')).toEqual([
      'sudo ufw allow 22',
      'sudo ufw allow 80',
    ]);
  });

  it('splits on top-level semicolons', () => {
    expect(splitCommand('cd ~/x; ls; pwd')).toEqual(['cd ~/x', 'ls', 'pwd']);
  });

  it('splits on newlines', () => {
    expect(splitCommand('a\nb\nc')).toEqual(['a', 'b', 'c']);
  });

  it('keeps a pipeline as one statement (never splits on |)', () => {
    expect(splitCommand('cat f | grep x | wc -l')).toEqual(['cat f | grep x | wc -l']);
  });

  it('does not split on ; inside quotes', () => {
    expect(splitCommand('echo "a;b" && echo c')).toEqual(['echo "a;b"', 'echo c']);
  });

  it('does not split on ; inside braces (PowerShell hashtable)', () => {
    const cmd = 'Get-WinEvent -FilterHashtable @{LogName="Security";Id=4625}';
    expect(splitCommand(cmd)).toEqual([cmd]);
  });

  it('ignores empty segments from trailing separators', () => {
    expect(splitCommand('ls && ')).toEqual(['ls']);
  });
});
