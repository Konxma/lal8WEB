import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
if (existsSync(resolve('.env'))) loadEnvFile(resolve('.env'));
